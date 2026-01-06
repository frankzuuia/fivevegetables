// =====================================================
// COMPONENT: Modal Detalle Cliente
// Muestra productos más pedidos + stats cliente (Dashboard Gerente)
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { X, Package, TrendingUp, Calendar, DollarSign } from 'lucide-react'

interface ClienteStats {
  cliente: {
    id: string
    name: string
    email: string | null
    phone: string | null
    memberSince: string
  }
  topProductos: Array<{
    productName: string
    odooProductId: number
    totalQuantity: number
    orderCount: number
    lastPrice: number
  }>
  stats: {
    totalOrders: number
    totalSpent: number
    averageOrderValue: number
  }
  lastOrder: {
    order_number: string
    total: number
    created_at: string
  } | null
}

interface ModalDetalleClienteProps {
  clienteId: string
  clienteName: string
  onClose: () => void
}

export function ModalDetalleCliente({ clienteId, clienteName, onClose }: ModalDetalleClienteProps) {
  const [data, setData] = useState<ClienteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/clientes/${clienteId}/stats`)
        
        if (!res.ok) {
          throw new Error('Error al cargar estadísticas')
        }
        
        const stats = await res.json()
        setData(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [clienteId])
  
  return (
    <Modal isOpen={true} size="lg" onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-morph-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              📊 Detalle Cliente
            </h2>
            <p className="mt-1 text-sm text-morph-gray-600">
              {clienteName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-morph-gray-100"
          >
            <X className="h-5 w-5 text-morph-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-morph-primary-200 border-t-morph-primary-600" />
            <p className="mt-4 text-morph-gray-600">Cargando estadísticas...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        ) : data ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-morph-gray-200 bg-gradient-to-br from-blue-50 to-white p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">Total Pedidos</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-morph-gray-900">
                  {data.stats.totalOrders}
                </p>
              </div>
              
              <div className="rounded-lg border border-morph-gray-200 bg-gradient-to-br from-green-50 to-white p-4">
                <div className="flex items-center gap-2 text-green-600">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm font-medium">Gasto Total</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-morph-gray-900">
                  ${data.stats.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="rounded-lg border border-morph-gray-200 bg-gradient-to-br from-purple-50 to-white p-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">Ticket Promedio</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-morph-gray-900">
                  ${data.stats.averageOrderValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            {/* Top Productos */}
            <div className="rounded-lg border border-morph-gray-200 bg-white">
              <div className="bg-gradient-to-r from-morph-primary-50 to-morph-primary-100 p-4">
                <h3 className="text-lg font-bold text-morph-gray-900">
                  🥇 Top 5 Productos Más Pedidos
                </h3>
              </div>
              
              <div className="divide-y divide-morph-gray-200">
                {data.topProductos.length > 0 ? (
                  data.topProductos.map((producto, index) => (
                    <div
                      key={producto.odooProductId}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : index === 1
                              ? 'bg-gray-200 text-gray-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-morph-gray-100 text-morph-gray-600'
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-morph-gray-900">
                            {producto.productName}
                          </p>
                          <p className="text-sm text-morph-gray-600">
                            {producto.orderCount} pedido(s)
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-morph-primary-700">
                          {producto.totalQuantity} unidades
                        </p>
                        <p className="text-sm text-morph-gray-600">
                          ${producto.lastPrice.toFixed(2)} c/u
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-morph-gray-600">
                    No hay productos pedidos aún
                  </div>
                )}
              </div>
            </div>
            
            {/* Última Compra */}
            {data.lastOrder && (
              <div className="rounded-lg border border-morph-gray-200 bg-gradient-to-br from-morph-gray-50 to-white p-4">
                <div className="flex items-center gap-2 text-morph-gray-700">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">Última Compra:</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-morph-gray-600">
                    {data.lastOrder.order_number} • {new Date(data.lastOrder.created_at).toLocaleDateString('es-MX')}
                  </span>
                  <span className="font-bold text-morph-primary-700">
                    ${data.lastOrder.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  )
}
