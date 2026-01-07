'use client'

import { Modal } from '@/components/ui/Modal'
import { TrendingUp, Users, ShoppingCart, X, Trophy, Award, Medal } from 'lucide-react'
import { useState } from 'react'
import type { QuickFilter } from '@/components/ui/CompactFilterBar'
import { CompactFilterBar } from '@/components/ui/CompactFilterBar'

interface Vendedor {
  id: string
  name: string
  salesTotal: number
  orderCount: number
}

interface ModalRankingVendedoresCompletoProps {
  isOpen: boolean
  onClose: () => void
  vendedores: Vendedor[]
  currentFilter?: QuickFilter
  onFilterChange?: (filter: QuickFilter) => void
}

export function ModalRankingVendedoresCompleto({
  isOpen,
  onClose,
  vendedores,
  currentFilter = 'hoy',
  onFilterChange
}: ModalRankingVendedoresCompletoProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filtrar por búsqueda
  const filteredVendedores = vendedores.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Award className="h-6 w-6 text-gray-400" />
    if (index === 2) return <Medal className="h-6 w-6 text-orange-500" />
    return null
  }
  
  const getRankBadgeColor = (index: number) => {
    if (index === 0) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    if (index === 1) return 'bg-gray-200 text-gray-700 border-gray-400'
    if (index === 2) return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-morph-gray-100 text-morph-gray-600 border-morph-gray-300'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex h-[85vh] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-morph-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900 flex items-center gap-2">
              💼 Ranking Completo de Vendedores
            </h2>
            <p className="text-sm text-morph-gray-600 mt-1">
              {filteredVendedores.length} vendedores ordenados por ventas totales
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-morph-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar + Filter */}
        <div className="mt-4 mb-4 flex gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar vendedor por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-morph-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          {onFilterChange && (
            <CompactFilterBar
              value={currentFilter}
              onChange={onFilterChange}
            />
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-700 font-medium">Top Vendedor</p>
                <p className="text-lg font-bold text-yellow-900 truncate">
                  {vendedores[0]?.name || 'N/A'}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            {vendedores[0] && (
              <p className="text-sm text-yellow-700 mt-2">
                ${vendedores[0].salesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium">Total Vendedores</p>
                <p className="text-2xl font-bold text-green-900">{vendedores.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium">Ventas Totales</p>
                <p className="text-lg font-bold text-blue-900">
                  ${vendedores.reduce((sum, v) => sum + v.salesTotal, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Lista Completa */}
        <div className="flex-1 overflow-y-auto border border-morph-gray-200 rounded-lg">
          {filteredVendedores.length > 0 ? (
            <div className="divide-y divide-morph-gray-200">
              {filteredVendedores.map((vendedor, index) => (
                <div
                  key={vendedor.id}
                  className="flex items-center gap-4 p-4 hover:bg-green-50 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold border-2 ${getRankBadgeColor(index)}`}
                    >
                      #{index + 1}
                    </div>
                    <div className="w-6">
                      {getMedalIcon(index)}
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <span className="text-lg font-bold text-green-700">
                      {vendedor.name.charAt(0).toUpperCase()}
                    </span>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-morph-gray-300" />
              <p className="mt-4 text-morph-gray-600">
                {searchTerm ? 'No se encontraron vendedores' : 'No hay datos disponibles'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
