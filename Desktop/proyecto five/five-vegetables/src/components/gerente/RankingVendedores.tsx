// =====================================================
// COMPONENT: Ranking Vendedores Top 5
// Muestra los 5 vendedores con más ventas (Dashboard Gerente)
// =====================================================

'use client'

import { TrendingUp, Users, ShoppingCart } from 'lucide-react'

interface Vendedor {
  id: string
  name: string
  salesTotal: number
  orderCount: number
}

interface RankingVendedoresProps {
  data: Vendedor[]
  isLoading?: boolean
  onVendedorClick?: (vendedorId: string) => void
}

export function RankingVendedores({ data, isLoading, onVendedorClick }: RankingVendedoresProps) {
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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              💼 Top 5 Vendedores
            </h2>
            <p className="mt-1 text-sm text-morph-gray-600">
              Vendedores con mayores ventas
            </p>
          </div>
          <div className="rounded-full bg-green-200 px-4 py-2">
            <span className="text-2xl font-bold text-green-700">
              {data.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Lista */}
      <div className="divide-y divide-morph-gray-200">
        {data.length > 0 ? (
          data.map((vendedor, index) => (
            <div
              key={vendedor.id}
              onClick={() => onVendedorClick?.(vendedor.id)}
              className={`flex items-center gap-4 p-4 transition-all ${
                onVendedorClick
                  ? 'cursor-pointer hover:bg-green-50 hover:shadow-sm'
                  : 'hover:bg-morph-gray-50'
              }`}
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
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-morph-gray-900 truncate">
                  {vendedor.name}
                </p>
                <p className="text-sm text-morph-gray-600">
                  Vendedor
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-lg font-bold text-green-700">
                  <TrendingUp className="h-4 w-4" />
                  <span>${vendedor.salesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-morph-gray-600">
                  <ShoppingCart className="h-3 w-3" />
                  <span>{vendedor.orderCount} pedidos</span>
                </div>
              </div>
              
              {/* Indicador click */}
              {onVendedorClick && (
                <div className="text-green-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-morph-gray-300" />
            <p className="mt-4 text-morph-gray-600">
              No hay datos de vendedores para el periodo seleccionado
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
