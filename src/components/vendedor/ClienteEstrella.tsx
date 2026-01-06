// =====================================================
// COMPONENT: Cliente Estrella
// Cliente con más compras del vendedor (Dashboard Vendedor)
// =====================================================

'use client'

import { Star, DollarSign, ShoppingBag, Calendar } from 'lucide-react'

interface ClienteEstrellaProps {
  cliente: {
    id: string
    name: string
    email?: string | null
    totalSpent: number
  } | null
  loading?: boolean
}

export function ClienteEstrella({ cliente, loading }: ClienteEstrellaProps) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
        <div className="h-6 w-32 rounded bg-yellow-200" />
        <div className="mt-4 h-8 w-48 rounded bg-yellow-100" />
      </div>
    )
  }
  
  if (!cliente) {
    return (
      <div className="rounded-lg border border-morph-gray-200 bg-gradient-to-br from-morph-gray-50 to-white p-6">
        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-morph-gray-300" />
          <div>
            <h3 className="font-bold text-morph-gray-900">
              ⭐ Cliente Estrella
            </h3>
            <p className="text-sm text-morph-gray-600">
              Aún no tienes ventas en este período
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="overflow-hidden rounded-lg border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 shadow-lg">
      {/* Header con gradiente oro */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4">
        <div className="flex items-center gap-3">
          <div className="animate-pulse rounded-full bg-white/30 p-3 backdrop-blur-sm">
            <Star className="h-6 w-6 fill-yellow-700 text-yellow-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-yellow-900">
              ⭐ Cliente Estrella
            </h3>
            <p className="text-sm text-yellow-800">
              Tu mejor cliente del período
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Nombre Cliente */}
        <div className="mb-4">
          <h4 className="text-2xl font-bold text-morph-gray-900">
            {cliente.name}
          </h4>
          {cliente.email && (
            <p className="text-sm text-morph-gray-600">
              {cliente.email}
            </p>
          )}
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-green-100 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-morph-gray-600">Total Gastado</p>
              <p className="text-xl font-bold text-green-700">
                ${cliente.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      {/* Badge decorativo */}
        <div className="mt-4 inline-block rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 text-sm font-bold text-yellow-900">
          🏆 #1 en Compras
        </div>
      </div>
    </div>
  )
}
