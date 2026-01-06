// =====================================================
// COMPONENT: Clientes Sin Asignar Card
// Tarjeta para dashboard gerente mostrando clientes nuevos
// =====================================================

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ModalAsignarVendedor } from './ModalAsignarVendedor'
import { useClientesSinAsignar } from '@/lib/hooks/useClientes'
import { AlertCircle, UserPlus } from 'lucide-react'

export function ClientesSinAsignar() {
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  const { data: clientes, isLoading, refetch } = useClientesSinAsignar()
  
  const handleSuccess = () => {
    refetch() // Refresh lista
    setModalOpen(false)
    setSelectedCliente(null)
  }
  
  if (isLoading) {
    return (
      <Card variant="elevated">
        <div className="p-6 text-center">
          <p className="text-morph-gray-600">Cargando...</p>
        </div>
      </Card>
    )
  }
  
  const totalClientes = clientes?.length || 0
  
  return (
    <>
      <Card variant="elevated" className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-morph-primary-500 to-morph-primary-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Clientes Sin Asignar
                </h2>
                <p className="text-sm text-white/80">
                  {totalClientes} cliente{totalClientes !== 1 ? 's' : ''}{' '}
                  esperando asignación
                </p>
              </div>
            </div>
            
            {totalClientes > 0 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <span className="text-lg font-bold text-white">
                  {totalClientes}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Lista de clientes */}
        <div className="p-6">
          {totalClientes === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-morph-gray-100">
                <UserPlus className="h-8 w-8 text-morph-gray-400" />
              </div>
              <p className="text-morph-gray-600">
                No hay clientes pendientes de asignación
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientes?.map((cliente: any) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between rounded-lg border border-morph-border bg-white p-4 transition-all hover:shadow-md"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-morph-gray-900">
                      {cliente.name}
                    </h3>
                    <p className="text-sm text-morph-gray-600">
                      {cliente.email}
                    </p>
                    {cliente.phone && (
                      <p className="text-sm text-morph-gray-500">
                        📱 {cliente.phone}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-morph-gray-400">
                      Registrado:{' '}
                      {new Date(cliente.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedCliente(cliente)
                      setModalOpen(true)
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Asignar Vendedor
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* Modal */}
      {modalOpen && selectedCliente && (
        <ModalAsignarVendedor
          cliente={selectedCliente}
          onClose={() => {
            setModalOpen(false)
            setSelectedCliente(null)
          }}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
