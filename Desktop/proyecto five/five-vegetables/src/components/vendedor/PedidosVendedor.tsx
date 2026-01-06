// =====================================================
// COMPONENT: Pedidos Vendedor
// Lista pedidos de mis clientes con acciones
// =====================================================

'use client'

import { useState } from 'react'
import { PedidoCard } from '../orders/PedidoCard'
import { ModalDatosFiscales } from '../orders/ModalDatosFiscales'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function PedidosVendedor() {
  const [selectedPedido, setSelectedPedido] = useState<any>(null)
  const [modalFacturaOpen, setModalFacturaOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  const { data: pedidos, isLoading, refetch } = useQuery({
    queryKey: ['pedidos-vendedor', filterStatus],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      
      let query = supabase
        .from('orders_shadow')
        .select(`
          *,
          cliente:clients_mirror!cliente_id(name, email, phone)
        `)
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false })
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data?.map((p: any) => ({
        ...p,
        cliente_name: p.cliente?.name || null,
      }))
    },
  })
  
  const marcarEntregadoMutation = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { marcarEntregado } = await import('@/app/actions/orders')
      const result = await marcarEntregado({ pedidoId })
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      return result
    },
    onSuccess: () => {
      toast.success('Pedido marcado como entregado')
      queryClient.invalidateQueries({ queryKey: ['pedidos-vendedor'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar')
    },
  })
  
  const handleMarcarEntregado = (pedidoId: string) => {
    marcarEntregadoMutation.mutate(pedidoId)
  }
  
  const handleSolicitarFactura = (pedido: any) => {
    setSelectedPedido(pedido)
    setModalFacturaOpen(true)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-morph-gray-900">
          Pedidos de Mis Clientes
        </h1>
        <p className="mt-2 text-morph-gray-600">
          Gestiona los pedidos de tu cartera
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
              userRole="vendedor"
              onMarcarEntregado={() => handleMarcarEntregado(pedido.id)}
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
            No hay pedidos{filterStatus !== 'all' ? ` en estado "${filterStatus}"` : ' de tus clientes'}
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
