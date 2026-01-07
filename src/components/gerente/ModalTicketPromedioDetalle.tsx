// =====================================================
// MODAL: Ticket Promedio - Métricas por Vendedor
// Shows avg ticket overall + per-vendor breakdown
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useTicketPromedioAnalytics } from '@/lib/hooks/useAnalytics'
import { DollarSign, TrendingUp, Users, ShoppingCart } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  isOpen: boolean
  onClose: () => void
  storeId: string
}

type FilterPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year'

export function ModalTicketPromedioDetalle({ isOpen, onClose, storeId }: Props) {
  const [period, setPeriod] = useState<FilterPeriod>('month')

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
        from = startOfMonth(now)
        to = endOfMonth(now)
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    }
  }

  const dateRange = getDateRange()
  const { data, isLoading } = useTicketPromedioAnalytics(storeId, dateRange)

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Análisis de Ticket Promedio"
      size="xl"
      className="h-[90vh] flex flex-col"
    >
      <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">
        
        {/* Period Filter */}
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto shrink-0">
          {[
            { key: 'today', label: 'Hoy' },
            { key: 'yesterday', label: 'Ayer' },
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mes' },
            { key: 'year', label: 'Año' }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setPeriod(option.key as FilterPeriod)}
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

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morph-primary-600"></div>
          </div>
        )}

        {data && (
          <>
            {/* Overall Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Ticket Promedio General</span>
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${data.overall.avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Pedidos</span>
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.overall.totalOrders}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Ingresos Totales</span>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${data.overall.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Trend Chart */}
            {data.timeline.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tendencia de Ticket Promedio</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'dd MMM', { locale: es })}
                      stroke="#666"
                    />
                    <YAxis 
                      stroke="#666"
                      tickFormatter={(value) => `$${value.toLocaleString('es-MX')}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ticket Promedio']}
                      labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: es })}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgTicket" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Per-Vendor Table */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Métricas por Vendedor</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Vendedor</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Ticket Promedio</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700"># Clientes</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700"># Pedidos</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Ventas Totales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.byVendor.map((vendor, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-morph-primary-100 flex items-center justify-center text-morph-primary-700 font-bold text-xs">
                              {vendor.vendorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{vendor.vendorName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-purple-600 font-bold text-base">
                            ${vendor.avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{vendor.clientCount}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 font-medium">
                          {vendor.orderCount}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-semibold">
                          ${vendor.totalSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Empty State */}
            {data.byVendor.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sin datos</h3>
                <p className="text-sm text-gray-500 mt-1">No hay pedidos en este período.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
