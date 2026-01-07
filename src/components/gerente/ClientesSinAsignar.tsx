// =====================================================
// COMPONENT: Widget Clientes Sin Asignar
// Widget de alerta que muestra un preview y expande a modal
// Responsive Mobile-First
// =====================================================

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ModalAsignarVendedor } from './ModalAsignarVendedor'
import { ModalClientesSinAsignar } from './ModalClientesSinAsignar'
import { useClientesSinAsignar } from '@/lib/hooks/useClientes'
import { AlertCircle, UserPlus, MapPin, ChevronRight, CheckCircle2, Maximize2 } from 'lucide-react'

export function ClientesSinAsignar() {
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [fullListOpen, setFullListOpen] = useState(false)
  
  const { data: clientes, isLoading, refetch } = useClientesSinAsignar()
  
  const totalPendientes = clientes?.length || 0
  const primerCliente = totalPendientes > 0 ? clientes[0] : null
  
  const handleSuccess = () => {
    refetch()
    setSelectedCliente(null)
  }

  // Loading State
  if (isLoading) {
    return (
      <Card variant="elevated" className="h-[280px] flex items-center justify-center">
        <p className="text-morph-gray-500 animate-pulse">Verificando...</p>
      </Card>
    )
  }

  // Estado: Todo en orden (0 pendientes)
  if (totalPendientes === 0) {
      return (
          <Card variant="flat" className="h-full min-h-[200px] border border-green-200 bg-green-50/50 flex flex-col items-center justify-center text-center p-6 relative group">
              {/* Botón expandir (opcional para ver histórico o lista vacía si se quisiera, 
                  pero aquí quizás sobra si está vacío. Lo pondré hidden pero listo) */}
              <button 
                  onClick={() => setFullListOpen(true)}
                  className="absolute top-3 right-3 p-1.5 text-green-700/50 hover:text-green-700 hover:bg-green-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Ver lista completa"
              >
                  <Maximize2 className="h-4 w-4" />
              </button>

              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-green-800">Todo Asignado</h3>
              <p className="text-sm text-green-700 mt-1">
                  No hay clientes nuevos esperando ruta.
              </p>
          </Card>
      )
  }
  
  // Estado: Hay pendientes
  return (
    <>
      <Card variant="elevated" className="flex flex-col h-full overflow-hidden border-l-4 border-l-yellow-500 relative group">
        
        {/* Header Alerta */}
        <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-yellow-600" />
               <span className="font-bold text-yellow-800 text-sm">Sin Asignar</span>
           </div>
           
           <div className="flex items-center gap-2">
                <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalPendientes}
                </span>
                {/* Botón Expandir en Esquina (Visible siempre en móvil, hover en desktop) */}
                <button 
                    onClick={() => setFullListOpen(true)}
                    className="p-1.5 text-yellow-700 hover:bg-yellow-200/50 rounded-md transition-colors"
                    title="Ver lista completa"
                >
                    <Maximize2 className="h-4 w-4" />
                </button>
           </div>
        </div>

        {/* Content: Primer Cliente Preview */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
                <span className="text-[10px] font-bold text-morph-gray-400 uppercase tracking-wider mb-1 block">
                    Pendiente Actual
                </span>
                <h3 className="text-lg font-bold text-morph-gray-900 truncate leading-tight">
                    {primerCliente.name}
                </h3>
                
                <div className="mt-3 flex items-start gap-2 bg-morph-gray-50 p-3 rounded-lg border border-morph-gray-100">
                    <MapPin className="h-4 w-4 text-morph-primary-500 mt-0.5 shrink-0" />
                    <div className="text-sm w-full">
                         <p className="font-medium text-morph-gray-700 leading-snug break-words">
                             {primerCliente.street} {primerCliente.numero_exterior}
                         </p>
                         <div className="text-xs text-morph-gray-500 mt-1 flex flex-wrap gap-1">
                             <span>{primerCliente.colonia ? `${primerCliente.colonia},` : ''}</span>
                             <span>{primerCliente.ciudad}</span>
                         </div>
                    </div>
                </div>
                
                <div className="mt-2 pl-1">
                     <p className="text-xs text-morph-gray-400">
                         📱 {primerCliente.phone || 'Sin teléfono'}
                     </p>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button 
                    className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm text-sm h-10 sm:h-9 justify-center"
                    onClick={() => setSelectedCliente(primerCliente)}
                >
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Asignar Ahora
                </Button>

                {totalPendientes > 1 && (
                    <Button 
                        variant="outline" 
                        className="w-full sm:flex-1 text-sm h-10 sm:h-9 border-morph-gray-300 text-morph-gray-600 hover:bg-morph-gray-50 justify-center hidden sm:flex"
                        onClick={() => setFullListOpen(true)}
                    >
                        +{totalPendientes - 1} más
                    </Button>
                )}
            </div>
        </div>
      </Card>
      
      {/* Modal para asignar solo al del preview */}
      {selectedCliente && (
        <ModalAsignarVendedor
          cliente={selectedCliente}
          onClose={() => setSelectedCliente(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal Lista Completa */}
      <ModalClientesSinAsignar 
        isOpen={fullListOpen}
        onClose={() => setFullListOpen(false)}
      />
    </>
  )
}
