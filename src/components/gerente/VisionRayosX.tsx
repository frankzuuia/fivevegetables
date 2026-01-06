// =====================================================
// COMPONENT: Visión Rayos X
// Ver cartera de cualquier vendedor (Dashboard Gerente)
// =====================================================

'use client'

import { useState } from 'react'
import { useClientesVendedor, useVendedoresActivos } from '@/lib/hooks/useVendedores'
import { Eye, User, Phone, Mail } from 'lucide-react'

interface VisionRayosXProps {
  storeId: string
}

export function VisionRayosX({ storeId }: VisionRayosXProps) {
  const [selectedVendedor, setSelectedVendedor] = useState<string>('')
  
  const { data: vendedores } = useVendedoresActivos(storeId)
  const { data: clientes, isLoading: loadingClientes } = useClientesVendedor(selectedVendedor)
  
  return (
    <div className="overflow-hidden rounded-lg border border-morph-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-200 p-3">
            <Eye className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              👁️ Visión Rayos X
            </h2>
            <p className="text-sm text-morph-gray-600">
              Ver la cartera de cualquier vendedor
            </p>
          </div>
        </div>
      </div>
      
      {/* Selector Vendedor */}
      <div className="border-b border-morph-gray-200 bg-morph-gray-50 p-4">
        <label className="mb-2 block text-sm font-medium text-morph-gray-700">
          Seleccionar Vendedor
        </label>
        <select
          value={selectedVendedor}
          onChange={(e) => setSelectedVendedor(e.target.value)}
          className="w-full rounded-lg border border-morph-gray-300 bg-white px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
        >
          <option value="">-- Selecciona un vendedor --</option>
          {vendedores?.map((v: any) => (
            <option key={v.id} value={v.id}>
              {v.full_name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Lista Clientes */}
      <div className="max-h-[400px] overflow-y-auto">
        {!selectedVendedor ? (
          <div className="py-12 text-center">
            <Eye className="mx-auto h-16 w-16 text-morph-gray-300" />
            <p className="mt-4 text-morph-gray-600">
              Selecciona un vendedor para ver su cartera
            </p>
          </div>
        ) : loadingClientes ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded bg-morph-gray-100" />
              ))}
            </div>
          </div>
        ) : clientes && clientes.length > 0 ? (
          <div className="divide-y divide-morph-gray-200">
            {clientes.map((cliente: any) => (
              <div
                key={cliente.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-purple-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-morph-gray-900 truncate">
                    {cliente.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-morph-gray-600">
                    {cliente.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {cliente.email}
                      </span>
                    )}
                    {cliente.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cliente.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Total */}
            <div className="bg-purple-50 p-4 text-center">
              <p className="text-sm font-semibold text-purple-700">
                Total: {clientes.length} cliente(s) en cartera
              </p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-morph-gray-300" />
            <p className="mt-4 text-morph-gray-600">
              Este vendedor no tiene clientes asignados
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
