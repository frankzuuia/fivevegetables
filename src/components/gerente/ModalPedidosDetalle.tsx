// =====================================================
// MODAL: Lista de Pedidos con Filtros
// Orders list with date filters, sorting, and drill-down
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ModalDetallePedido } from './ModalDetallePedido'
import { useOrdersList } from '@/lib/hooks/useAnalytics'
import { Search, ArrowUpDown, Calendar, DollarSign, User, ChevronRight } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  isOpen: boolean
  onClose: () => void
  storeId: string
}

type FilterPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year'

export function ModalPedidosDetalle({ isOpen, onClose, storeId }: Props) {
  const [period, setPeriod] = useState<FilterPeriod>('today')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Calculate date range based on period
  const getDateRange = (): { from: string; to: string } => {
    const now = new Date()
    let from: Date, to: Date

    switch (period) {
      case 'today':
        from = startOfDay(now)
        to = endOfDay(now)
        break
      case 'yesterday':
        from = startOfDay(subDays(now, 1))
        to = endOfDay(subDays(now, 1))
        break
      case 'week':
        from = startOfWeek(now, { locale: es })
        to = endOfWeek(now, { locale: es })
        break
      case 'month':
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case 'year':
        from = startOfYear(now)
        to = endOfYear(now)
        break
      default:
        from = startOfDay(now)
        to = endOfDay(now)
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    }
  }

  const dateRange = getDateRange()
  const { data, isLoading } = useOrdersList(storeId, dateRange, { sortBy, sortOrder, page, pageSize: 20 })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      confirmed: 'bg-blue-100 text-blue-700',
      sale: 'bg-green-100 text-green-700',
      delivered: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Historial de Pedidos"
        size="xl"
        className="h-[90vh] flex flex-col"
      >
        <div className="flex flex-col h-full space-y-4">
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            {/* Period Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto">
              {[
                { key: 'today', label: 'Hoy' },
                { key: 'yesterday', label: 'Ayer' },
                { key: 'week', label: 'Semana' },
                { key: 'month', label: 'Mes' },
                { key: 'year', label: 'Año' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => { setPeriod(option.key as FilterPeriod); setPage(1) }}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                    period === option.key
                      ? 'bg-white text-morph-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as ['date' | 'amount', 'asc' | 'desc']
                setSortBy(newSortBy)
                setSortOrder(newSortOrder)
                setPage(1)
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-morph-primary-500"
            >
              <option value="date-desc">Más Recientes</option>
              <option value="date-asc">Más Antiguos</option>
              <option value="amount-desc">Mayor Monto</option>
              <option value="amount-asc">Menor Monto</option>
            </select>
          </div>

          {/* Summary */}
          {data && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200 shrink-0">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{data.pagination.total}</span> pedidos encontrados
              </p>
            </div>
          )}

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morph-primary-600"></div>
              </div>
            )}

            {data && data.orders.length > 0 && data.orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-morph-primary-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Order Number & Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900">#{order.orderNumber}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Cliente */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <User className="h-4 w-4" />
                      <span className="truncate">{order.cliente.name}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.date), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                    </div>

                    {/* Vendedor */}
                    {order.vendedor.name && (
                      <p className="text-xs text-gray-500 mt-1">
                        Vendedor: <span className="font-medium">{order.vendedor.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Amount & Arrow */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-morph-primary-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {data && data.orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sin pedidos</h3>
                <p className="text-sm text-gray-500 mt-1">No hay pedidos en este período.</p>
              </div>
            )}

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

        </div>
      </Modal>

      {/* Nested Modal for Order Detail */}
      <ModalDetallePedido
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </>
  )
}
