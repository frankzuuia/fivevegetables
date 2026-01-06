// =====================================================
// COMPONENT: Mis Pedidos (Cliente)
// Lista de pedidos del cliente con filtros
// =====================================================

'use client'

import { useState } from 'react'
import { PedidoCard } from './PedidoCard'
import { ModalDatosFiscales } from './ModalDatosFiscales'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/hooks/useCart'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function MisPedidos() {
  const router = useRouter()
  const { addItem } = useCart()
  const [selectedPedido, setSelectedPedido] = useState<any>(null)
  const [modalFacturaOpen, setModalFacturaOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const supabase = createClient()
  
  const { data: pedidos, isLoading, refetch } = useQuery({
    queryKey: ['mis-pedidos', filterStatus],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      
      // Obtener cliente_id desde clients_mirror
      const { data: cliente } = await supabase
        .from('clients_mirror')
        .select('id')
        .eq('profile_id', user.id)
        .single()
      
      if (!cliente) throw new Error('Cliente no encontrado')
      
      let query = supabase
        .from('orders_shadow')
        .select(`
          *,
          vendedor:profiles!vendedor_id(full_name)
        `)
        .eq('cliente_id', (cliente as any).id)
        .order('created_at', { ascending: false })
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data?.map((p: any) => ({
        ...p,
        vendedor_name: p.vendedor?.full_name || null,
      }))
    },
  })
  
  const handleMarcarRecibido = async (pedidoId: string) => {
    try {
      const { marcarRecibido } = await import('@/app/actions/orders')
      const result = await marcarRecibido({ pedidoId })
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      toast.success('Pedido marcado como recibido')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
      console.error(err)
    }
  }
  
  const handleSolicitarFactura = (pedido: any) => {
    setSelectedPedido(pedido)
    setModalFacturaOpen(true)
  }
  
  const handleRepetirPedido = async (pedidoId: string) => {
    try {
      // Query order_items for this pedido
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products_cache:product_id (
            id,
            odoo_product_id,
            name,
            image_url,
            category
          )
        `)
        .eq('order_id', pedidoId)
      
      if (error) throw error
      
      if (!orderItems || orderItems.length === 0) {
        toast.error('No se encontraron productos en este pedido')
        return
      }
      
      // Add all items to cart
      let addedCount = 0
      orderItems.forEach((item: any) => {
        const product = item.products_cache
        if (product) {
          addItem({
            productId: product.id,
            odooProductId: item.odoo_product_id,
            name: item.product_name,
            price: item.unit_price,
            quantity: item.quantity,
            imageUrl: product.image_url,
            unit: 'pz', // Default unit
            category: product.category,
          }, item.quantity)
          addedCount++
        }
      })
      
      toast.success(`✅ ${addedCount} productos agregados al carrito`)
      router.push('/dashboard/cliente') // Navigate to catalogo
    } catch (error) {
      console.error('[Repetir Pedido Error]', error)
      toast.error('Error al repetir pedido')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-morph-gray-900">Mis Pedidos</h1>
        <p className="mt-2 text-morph-gray-600">
          Historial completo de tus pedidos
        </p>
      </div>
      
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Todos', count: pedidos?.length || 0 },
          { value: 'confirmed', label: 'Confirmados', count: pedidos?.filter((p: any) => p.status === 'confirmed').length || 0 },
          { value: 'received', label: 'Recibidos', count: pedidos?.filter((p: any) => p.status === 'received').length || 0 },
          { value: 'delivered', label: 'Entregados', count: pedidos?.filter((p: any) => p.status === 'delivered').length || 0 },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filterStatus === filter.value
                ? 'bg-morph-primary-600 text-white shadow-md'
                : 'bg-white text-morph-gray-700 hover:bg-morph-gray-50'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>
      
      {/* Lista de pedidos */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-morph-gray-600">Cargando pedidos...</p>
        </div>
      ) : pedidos && pedidos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {pedidos.map((pedido: any) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              userRole="cliente"
              onMarcarRecibido={() => handleMarcarRecibido(pedido.id)}
              onSolicitarFactura={() => handleSolicitarFactura(pedido)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-morph-gray-100">
            <span className="text-3xl">📦</span>
          </div>
          <p className="text-morph-gray-600">
            No tienes pedidos{filterStatus !== 'all' ? ` en estado "${filterStatus}"` : ''}
          </p>
        </div>
      )}
      
      {/* Modal Factura */}
      {modalFacturaOpen && selectedPedido && (
        <ModalDatosFiscales
          pedidoId={selectedPedido.id}
          onClose={() => {
            setModalFacturaOpen(false)
            setSelectedPedido(null)
          }}
        />
      )}
    </div>
  )
}
