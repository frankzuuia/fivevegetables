// =====================================================
// MODAL: Clientes Nuevos
// Shows new client registrations with vendor assignment
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useNewClientsAnalytics } from '@/lib/hooks/useAnalytics'
import { UserPlus, Calendar, MapPin, Phone, Users, ChevronRight } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  isOpen: boolean
  onClose: () => void
  storeId: string
  onClientClick?: (id: string, name: string) => void
}

type FilterPeriod = 'day' | 'week' | 'month' | 'year'

export function ModalClientesNuevos({ isOpen, onClose, storeId, onClientClick }: Props) {
  const [period, setPeriod] = useState<FilterPeriod>('month')

  const getDateRange = (): { from: string; to: string } => {
    const now = new Date()
    let from: Date, to: Date

    switch (period) {
      case 'day':
        from = startOfDay(now)
        to = endOfDay(now)
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
  const { data, isLoading } = useNewClientsAnalytics(storeId, dateRange)

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clientes Nuevos"
      size="xl"
      className="h-[90vh] flex flex-col"
    >
      <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">
        
        {/* Period Filter */}
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto shrink-0">
          {[
            { key: 'day', label: 'Hoy' },
            { key: 'week', label: 'Esta Semana' },
            { key: 'month', label: 'Este Mes' },
            { key: 'year', label: 'Este Año' }
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Nuevos</span>
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.summary.total}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Con Vendedor</span>
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.summary.withVendor}</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Sin Asignar</span>
                  <Users className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.summary.withoutVendor}</p>
              </div>
            </div>

            {/* Clients List */}
            <div className="space-y-3">
              {data.clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => onClientClick?.(client.id, client.name)}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-morph-primary-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Client Name & Badge */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{client.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {client.hasVendor ? (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                                ✓ {client.vendedor?.name}
                              </span>
                            ) : (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                ⚠️ Sin vendedor
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 text-sm text-gray-600 ml-12">
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.address.street && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                            <div className="text-xs">
                              <p>{client.address.street} {client.address.numeroExterior}</p>
                              <p className="text-gray-500">{client.address.colonia}, {client.address.ciudad}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Registrado: {format(new Date(client.registeredAt), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-morph-primary-600 transition-colors shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {data.clients.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sin clientes nuevos</h3>
                <p className="text-sm text-gray-500 mt-1">No hay registros nuevos en este período.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
