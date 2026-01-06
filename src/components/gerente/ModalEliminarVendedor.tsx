// =====================================================
// COMPONENT: Modal Eliminar Vendedor
// Reasignación masiva clientes + confirmación
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useClientesVendedor, useVendedoresActivos, useEliminarVendedor } from '@/lib/hooks/useVendedores'
import { AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'

interface ModalEliminarVendedorProps {
  vendedor: {
    id: string
    full_name: string
  }
  storeId: string
  onClose: () => void
  onSuccess: () => void
}

export function ModalEliminarVendedor({
  vendedor,
  storeId,
  onClose,
  onSuccess,
}: ModalEliminarVendedorProps) {
  const { data: clientes, isLoading: loadingClientes } = useClientesVendedor(vendedor.id)
  const { data: vendedoresDisponibles } = useVendedoresActivos(storeId)
  const eliminarMutation = useEliminarVendedor()
  
  // Map clienteId -> nuevoVendedorId
  const [reasignaciones, setReasignaciones] = useState<Record<string, string>>({})
  const [reasignarTodosA, setReasignarTodosA] = useState<string>('')
  
  const vendedoresOpciones = (vendedoresDisponibles || []).filter((v: any) => v.id !== vendedor.id)
  
  const handleReasignarTodos = () => {
    if (!reasignarTodosA || !clientes) return
    
    const nuevasReasignaciones: Record<string, string> = {}
    clientes.forEach(cliente => {
      nuevasReasignaciones[cliente.id] = reasignarTodosA
    })
    setReasignaciones(nuevasReasignaciones)
    toast.success(`${clientes.length} clientes asignados a vendedor seleccionado`)
  }
  
  const handleConfirmar = async () => {
    if (!clientes) return
    
    // Validar que TODOS los clientes tienen reasignación
    const faltantes = clientes.filter(c => !reasignaciones[c.id])
    if (faltantes.length > 0) {
      toast.error(`Debes reasignar TODOS los ${clientes.length} clientes antes de eliminar`)
      return
    }
    
    // Construir array de reasignaciones
    const clientesReasignacion = clientes.map(c => ({
      clienteId: c.id,
      nuevoVendedorId: reasignaciones[c.id],
    }))
    
    try {
      await eliminarMutation.mutateAsync({
        vendedorId: vendedor.id,
        clientesReasignacion,
      })
      
      toast.success(`Vendedor ${vendedor.full_name} eliminado exitosamente`)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar vendedor')
    }
  }
  
  return (
    <Modal isOpen={true} size="lg" onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-morph-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              Eliminar Vendedor
            </h2>
            <p className="mt-1 text-sm text-morph-gray-600">
              {vendedor.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-morph-gray-100"
          >
            <X className="h-5 w-5 text-morph-gray-500" />
          </button>
        </div>
        
        {/* Warning */}
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">
                Acción Irreversible
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                {loadingClientes
                  ? 'Cargando clientes...'
                  : clientes && clientes.length > 0
                  ? `Este vendedor tiene ${clientes.length} cliente(s) asignado(s). Debes reasignar TODOS antes de eliminarlo.`
                  : 'Este vendedor no tiene clientes asignados. Puedes eliminarlo directamente.'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Reasignación masiva */}
        {clientes && clientes.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-morph-primary-50 p-4">
              <h3 className="font-semibold text-morph-gray-800 mb-3">
                ⚡ Reasignación Rápida (Todos los clientes)
              </h3>
              <div className="flex gap-3">
                <select
                  value={reasignarTodosA}
                  onChange={(e) => setReasignarTodosA(e.target.value)}
                  className="flex-1 rounded-lg border border-morph-gray-300 bg-white px-4 py-2"
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendedoresOpciones.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.full_name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReasignarTodos}
                  disabled={!reasignarTodosA}
                >
                  Aplicar a Todos
                </Button>
              </div>
            </div>
            
            {/* Lista clientes individual */}
            <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-2">
              <h3 className="font-semibold text-morph-gray-800">
                Reasignación Individual
              </h3>
              
              {clientes.map((cliente: any) => (
                <div
                  key={cliente.id}
                  className="flex items-center gap-3 rounded-lg border border-morph-gray-200 bg-white p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-morph-gray-900">
                      {cliente.name}
                    </p>
                    <p className="text-sm text-morph-gray-600">
                      {cliente.email || cliente.phone}
                    </p>
                  </div>
                  
                  <div className="w-48">
                    <select
                      value={reasignaciones[cliente.id] || ''}
                      onChange={(e) =>
                        setReasignaciones(prev => ({
                          ...prev,
                          [cliente.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-morph-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {vendedoresOpciones.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3 border-t border-morph-gray-200 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmar}
            className="flex-1"
            disabled={
              eliminarMutation.isPending ||
              loadingClientes ||
              (clientes && clientes.length > 0 && Object.keys(reasignaciones).length !== clientes.length)
            }
          >
            {eliminarMutation.isPending ? 'Eliminando...' : 'Confirmar Eliminación'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
