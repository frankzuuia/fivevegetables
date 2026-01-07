// =====================================================
// COMPONENT: Ranking Clientes Top 5
// Muestra los 5 clientes con más compras (Dashboard Gerente)
// =====================================================

'use client'

import { TrendingUp, User, ShoppingBag } from 'lucide-react'

interface Cliente {
  id: string
  name: string
  email: string | null
  totalSpent: number
  orderCount: number
}

interface RankingClientesProps {
  data: Cliente[]
  isLoading?: boolean
  onClienteClick?: (clienteId: string, clienteName: string) => void
  onViewAll?: () => void
}

export function RankingClientes({ data, isLoading, onClienteClick, onViewAll }: RankingClientesProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-morph-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-morph-gray-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded bg-morph-gray-100" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="overflow-hidden rounded-lg border border-morph-gray-200 bg-white shadow-sm">
      {/* Header - CLICKABLE */}
      <div 
        onClick={onViewAll}
        className={`bg-gradient-to-r from-morph-primary-50 to-morph-primary-100 p-6 ${onViewAll ? 'cursor-pointer hover:from-morph-primary-100 hover:to-morph-primary-200 transition-all' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              🏆 Top 5 Clientes
            </h2>
            <p className="mt-1 text-sm text-morph-gray-600">
              Clientes con mayores compras {onViewAll && '• Click para ver todos'}
            </p>
          </div>
          <div className="rounded-full bg-morph-primary-200 px-4 py-2">
            <span className="text-2xl font-bold text-morph-primary-700">
              {data.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Lista */}
      <div className="divide-y divide-morph-gray-200">
        {data.length > 0 ? (
          data.map((cliente, index) => (
            <div
              key={cliente.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-morph-gray-50"
            >
              {/* Badge posición */}
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${
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
              
              {/* Avatar */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-morph-primary-100">
                <User className="h-6 w-6 text-morph-primary-600" />
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-morph-gray-900 truncate">
                  {cliente.name}
                </p>
                {cliente.email && (
                  <p className="text-sm text-morph-gray-600 truncate">
                    {cliente.email}
                  </p>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-lg font-bold text-morph-primary-700">
                  <TrendingUp className="h-4 w-4" />
                  <span>${cliente.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-morph-gray-600">
                  <ShoppingBag className="h-3 w-3" />
                  <span>{cliente.orderCount} pedidos</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-morph-gray-300" />
            <p className="mt-4 text-morph-gray-600">
              No hay datos de clientes para el periodo seleccionado
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
