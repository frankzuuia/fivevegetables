// =====================================================
// COMPONENT: Mi Cartera
// Lista clientes asignados del vendedor (Dashboard Vendedor)
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SearchBar } from '@/components/ui/SearchBar'
import { ModalControlRemotoPrecios } from './ModalControlRemotoPrecios'
import { Users, Phone, Mail, DollarSign, ShoppingBag, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface Cliente {
  id: string
  name: string
  email: string | null
  phone: string | null
 pricelist_id: string | null
  pricelist_name: string
  total_spent: number
  order_count: number
  last_order_date: string | null
}

export function MiCartera() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  
  const fetchCartera = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('No autenticado')
        return
      }
      
      // Query vendedor_clientes JOIN clients_mirror
      const { data: vendedorClientes, error } = await supabase
        .from('vendedor_clientes')
        .select(`
          cliente_id,
          clients_mirror!inner (
            id,
            name,
            email,
            phone,
            pricelist_id_new
          )
        `)
        .eq('vendedor_id', user.id)
      
      if (error) throw error
      
      // Fetch orders stats for each cliente
      const clientesWithStats = await Promise.all(
        (vendedorClientes || []).map(async (vc: any) => {
          const cliente = vc.clients_mirror
          
          // Get orders stats
          const { data: orders } = await supabase
            .from('orders_shadow')
            .select('total, created_at')
            .eq('cliente_id', cliente.id)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })
          
          const totalSpent = orders?.reduce((sum: number, o: any) => sum + o.total, 0) || 0
          const orderCount = orders?.length || 0
          const lastOrderDate = (orders as any)?.[0]?.created_at || null
          
          // Get pricelist name
          let pricelistName = 'Sin tarifa'
          let pricelistId = null
          if (cliente.pricelist_id_new) {
            const { data: pricelist } = await supabase
              .from('price_lists')
              .select('id, name')
              .eq('id', cliente.pricelist_id_new)
              .single()
            
            if (pricelist) {
              pricelistName = (pricelist as any).name
              pricelistId = (pricelist as any).id
            }
          }
          
          return {
            id: cliente.id,
            name: cliente.name,
            email: cliente.email,
            phone: cliente.phone,
            pricelist_id: pricelistId,
            pricelist_name: pricelistName,
            total_spent: totalSpent,
            order_count: orderCount,
            last_order_date: lastOrderDate,
          }
        })
      )
      
      setClientes(clientesWithStats)
      setFilteredClientes(clientesWithStats)
    } catch (error) {
      console.error('[Mi Cartera Error]', error)
      toast.error('Error al cargar cartera')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchCartera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = clientes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
      )
      setFilteredClientes(filtered)
    } else {
      setFilteredClientes(clientes)
    }
  }, [searchQuery, clientes])
  
  const sendWhatsApp = (phone: string, name: string) => {
    if (!phone) {
      toast.error('Cliente sin teléfono')
      return
    }
    
    const message = `Hola ${name}, soy tu vendedor de Five Vegetables. ¿En qué puedo ayudarte?`
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-200 p-3">
            <Users className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              💼 Mi Cartera
            </h2>
            <p className="text-sm text-morph-gray-600">
              {filteredClientes.length} cliente(s) asignados
            </p>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onSearch={setSearchQuery}
        placeholder="Buscar por nombre, email o teléfono..."
      />
      
      {/* Lista Clientes */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-morph-gray-200 bg-white p-6">
              <div className="h-6 w-32 rounded bg-morph-gray-200" />
              <div className="mt-4 h-4 w-48 rounded bg-morph-gray-100" />
            </div>
          ))}
        </div>
      ) : filteredClientes.length > 0 ? (
        <div className="space-y-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="overflow-hidden rounded-lg border border-morph-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Cliente Header */}
              <div className="border-b border-morph-gray-200 bg-gradient-to-r from-morph-gray-50 to-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-morph-gray-900">
                        {cliente.name}
                      </h3>
                      <p className="text-sm text-morph-gray-600">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          {cliente.pricelist_name}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCliente(cliente)}
                    className="rounded-lg bg-morph-primary-100 px-3 py-2 text-sm font-medium text-morph-primary-700 transition-colors hover:bg-morph-primary-200"
                    title="Cambiar Tarifa"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-morph-gray-600">Total Gastado</p>
                    <p className="font-bold text-morph-gray-900">
                      ${cliente.total_spent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-morph-gray-600">Pedidos</p>
                    <p className="font-bold text-morph-gray-900">
                      {cliente.order_count}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="border-t border-morph-gray-200 bg-morph-gray-50 p-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-morph-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-morph-gray-600" />
                      <span className="text-morph-gray-600">{cliente.phone}</span>
                      <button
                        onClick={() => sendWhatsApp(cliente.phone!, cliente.name)}
                        className="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-600"
                      >
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
                
                {cliente.last_order_date && (
                  <p className="mt-2 text-xs text-morph-gray-500">
                    Último pedido: {new Date(cliente.last_order_date).toLocaleDateString('es-MX')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-morph-gray-200 bg-white p-12 text-center">
          <Users className="mx-auto h-16 w-16 text-morph-gray-300" />
          <p className="mt-4 text-morph-gray-600">
            {searchQuery ? 'No se encontraron clientes' : 'No tienes clientes asignados aún'}
          </p>
        </div>
      )}
      
      {/* Modal Control Remoto Precios */}
      {selectedCliente && (
        <ModalControlRemotoPrecios
          clienteId={selectedCliente.id}
          clienteName={selectedCliente.name}
          currentPricelistId={selectedCliente.pricelist_id}
          onClose={() => setSelectedCliente(null)}
          onSuccess={() => {
            setSelectedCliente(null)
            fetchCartera() // Refresh data
          }}
        />
      )}
    </div>
  )
}
