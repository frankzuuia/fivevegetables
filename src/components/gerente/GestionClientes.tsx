// =====================================================
// COMPONENT: Gestión Clientes (Gerente)
// Tabla completa clientes con search + reasignación
// =====================================================

'use client'

import { useState } from 'react'
import { ModalAsignarVendedor } from './ModalAsignarVendedor'
import { AsignarPriceListModal } from './AsignarPriceListModal'
import { useAllClientes } from '@/lib/hooks/useClientes'
import { Search, UserCheck, Users, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function GestionClientes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [priceListModalOpen, setPriceListModalOpen] = useState(false)
  
  const { data: clientes, isLoading } = useAllClientes(searchTerm)
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-morph-gray-900">
            Gestión de Clientes
          </h1>
          <p className="mt-2 text-morph-gray-600">
            Control total de asignaciones vendedor + tarifa
          </p>
        </div>
        
        <div className="flex items-center gap-2 rounded-lg bg-morph-primary-50 px-4 py-2">
          <Users className="h-5 w-5 text-morph-primary-600" />
          <span className="text-2xl font-bold text-morph-primary-700">
            {clientes?.length || 0}
          </span>
          <span className="text-sm text-morph-gray-600">clientes</span>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-morph-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nombre..."
          className="w-full rounded-lg border border-morph-gray-300 bg-white py-3 pl-12 pr-4 transition-all focus:border-transparent focus:ring-2 focus:ring-morph-primary-500"
        />
      </div>
      
      {/* Tabla */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-morph-gray-600">Cargando clientes...</p>
        </div>
      ) : clientes && clientes.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-morph-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-morph-gray-50 to-morph-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-morph-gray-700">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-morph-gray-700">
                  Vendedor Actual
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-morph-gray-700">
                  Tarifa
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-morph-gray-700">
                  Registro
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-morph-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-morph-gray-200">
              {clientes.map((cliente: any) => (
                <tr
                  key={cliente.id}
                  className="transition-colors hover:bg-morph-gray-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-morph-gray-900">
                        {cliente.name}
                      </p>
                      <p className="text-sm text-morph-gray-600">
                        {cliente.email || 'Sin email'}
                      </p>
                      <p className="text-xs text-morph-gray-500">
                        📞 {cliente.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {cliente.vendedor_name ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-morph-primary-600" />
                        <span className="font-medium text-morph-gray-900">
                          {cliente.vendedor_name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                        ⚠️ Sin asignar
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {cliente.pricelist_name ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-morph-primary-100 px-3 py-1 text-xs font-medium text-morph-primary-700">
                        💰 {cliente.pricelist_name}
                      </span>
                    ) : (
                      <span className="text-sm text-morph-gray-400">
                        Sin tarifa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-morph-gray-600">
                      {formatDate(cliente.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCliente(cliente)
                          setModalOpen(true)
                        }}
                      >
                        {cliente.vendedor_id ? '🔄 Reasignar' : '👤 Asignar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCliente(cliente)
                          setPriceListModalOpen(true)
                        }}
                        className="border-morph-primary-300 text-morph-primary-600 hover:bg-morph-primary-50"
                        title="Asignar lista de precios"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-morph-gray-100">
            <Users className="h-8 w-8 text-morph-gray-400" />
          </div>
          <p className="text-morph-gray-600">
            {searchTerm
              ? `No se encontraron clientes con "${searchTerm}"`
              : 'No hay clientes registrados'}
          </p>
        </div>
      )}
      
      {/* Modal Asignar/Reasignar Vendedor */}
      {modalOpen && selectedCliente && (
        <ModalAsignarVendedor
          cliente={selectedCliente}
          onClose={() => {
            setModalOpen(false)
            setSelectedCliente(null)
          }}
          onSuccess={() => {
            setModalOpen(false)
            setSelectedCliente(null)
          }}
        />
      )}
      
      {/* Modal Asignar Lista de Precios */}
      {priceListModalOpen && selectedCliente && (
        <AsignarPriceListModal
          cliente={selectedCliente}
          onClose={() => {
            setPriceListModalOpen(false)
            setSelectedCliente(null)
          }}
          onSuccess={() => {
            setPriceListModalOpen(false)
            setSelectedCliente(null)
          }}
        />
      )}
    </div>
  )
}
