// =====================================================
// MODAL: Ingresos Totales - Revenue Analytics
// Shows revenue timeline and breakdown by vendor
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useRevenueAnalytics } from '@/lib/hooks/useAnalytics'
import { Calendar, TrendingUp, DollarSign, Users } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  isOpen: boolean
  onClose: () => void
  storeId: string
  initialDateRange: { from: string; to: string }
}

export function ModalIngresosDetalle({ isOpen, onClose, storeId, initialDateRange }: Props) {
  const [dateRange, setDateRange] = useState(initialDateRange)
  
  const { data, isLoading } = useRevenueAnalytics(storeId, dateRange)

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Análisis de Ingresos"
      size="xl"
      className="h-[90vh] flex flex-col"
    >
      <div className="flex flex-col space-y-6 overflow-y-auto flex-1 pr-2">
        
        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Ingresos Totales</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${data.summary.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Pedidos</span>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.summary.orderCount}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Ticket Promedio</span>
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${data.summary.avgOrderValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morph-primary-600"></div>
          </div>
        )}

        {/* Revenue Timeline Chart */}
        {data && data.revenueTimeline.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Evolución de Ingresos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.revenueTimeline}>
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
                  formatter={(value: any) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ingresos']}
                  labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy', { locale: es })}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue by Vendor */}
        {data && data.revenueByVendor.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ingresos por Vendedor</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByVendor}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis 
                  stroke="#666"
                  tickFormatter={(value) => `$${value.toLocaleString('es-MX')}`}
                />
                <Tooltip 
                  formatter={(value: any) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Ingresos']}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Ingresos" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Vendor Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Vendedor</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Ingresos</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Pedidos</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.revenueByVendor.map((vendor, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{vendor.name}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        ${vendor.revenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{vendor.orderCount}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ${(vendor.revenue / vendor.orderCount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {data && data.revenueTimeline.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Sin datos en este período</h3>
            <p className="text-sm text-gray-500 mt-1">No hay ingresos registrados para las fechas seleccionadas.</p>
          </div>
        )}

      </div>
    </Modal>
  )
}
