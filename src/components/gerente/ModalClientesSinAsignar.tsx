// =====================================================
// COMPONENT: Modal Clientes Sin Asignar (Full List)
// Modal para ver y gestionar TODOS los clientes pendientes
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ModalAsignarVendedor } from './ModalAsignarVendedor'
import { useClientesSinAsignar } from '@/lib/hooks/useClientes'
import { AlertCircle, UserPlus, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ModalClientesSinAsignar({ isOpen, onClose }: Props) {
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const { data: clientes, isLoading, refetch } = useClientesSinAsignar()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSuccess = () => {
    refetch() // Recargar lista
    setSelectedCliente(null)
  }

  // Filtrado local simple
  const filteredClientes = clientes?.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.street?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clientes Pendientes de Asignación"
      size="lg"
      className="h-[80vh] flex flex-col"
    >
      <div className="flex flex-col h-full space-y-4">
        
        {/* Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
                <h4 className="font-semibold text-yellow-800">Acción Requerida</h4>
                <p className="text-sm text-yellow-700">
                    Estos clientes se registraron pero no tienen un vendedor asignado. 
                    No podrán ser atendidos hasta que se les asigne una ruta.
                </p>
            </div>
        </div>

        {/* Buscador */}
        <div className="relative shrink-0">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-morph-gray-400" />
             <input 
                type="text"
                placeholder="Buscar en lista pendiente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-morph-gray-300 pl-9 py-2 text-sm focus:ring-2 focus:ring-morph-primary-500"
             />
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-morph-gray-500">Cargando...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-morph-gray-900">¡Todo al día!</h3>
                <p className="text-morph-gray-500">No hay clientes pendientes por asignar.</p>
            </div>
          ) : (
            filteredClientes.map((cliente: any) => (
               <div key={cliente.id} className="bg-white border border-morph-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-morph-gray-900 text-lg truncate">{cliente.name}</h3>
                      
                      <div className="mt-2 flex items-start gap-2 text-sm text-morph-gray-600">
                         <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-morph-primary-500" />
                         <div className="leading-snug">
                            <p className="font-medium">
                                {cliente.street || 'Calle desconocida'} {cliente.numero_exterior}
                            </p>
                            <p className="text-xs text-morph-gray-500">
                                {cliente.colonia} {cliente.codigo_postal ? `, CP ${cliente.codigo_postal}` : ''} • {cliente.ciudad}
                            </p>
                         </div>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-morph-gray-400">
                          <span>📞 {cliente.phone || 'Sin teléfono'}</span>
                          <span>📅 {new Date(cliente.created_at).toLocaleDateString('es-MX')}</span>
                      </div>
                  </div>

                  <Button
                    onClick={() => setSelectedCliente(cliente)}
                    className="shrink-0 whitespace-nowrap bg-morph-primary-600 hover:bg-morph-primary-700 text-white shadow-morph-sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Asignar Vendedor
                  </Button>
               </div>
            ))
          )}
        </div>

      </div>

      {/* Modal Interno de Asignación */}
      {selectedCliente && (
        <ModalAsignarVendedor
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
          onSuccess={handleSuccess}
        />
      )}
    </Modal>
  )
}
