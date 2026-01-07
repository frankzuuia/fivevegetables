// =====================================================
// COMPONENT: Gestión Clientes (Widget Dashboard)
// Vista resumen (Top 3) + Trigger para Modal de Gestión Completa
// =====================================================

'use client'

import { useState } from 'react'
import { useAllClientes } from '@/lib/hooks/useClientes'
import { Users, ExternalLink, ChevronRight, Store } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ModalGestionClientesCompleta } from './ModalGestionClientesCompleta'

export function GestionClientes() {
  const [modalCompletoOpen, setModalCompletoOpen] = useState(false)
  
  // Pedimos clientes (sin termino de búsqueda para el widget)
  const { data: clientes, isLoading } = useAllClientes('')
  
  // Tomamos solo los primeros 3 para el preview
  const previewClientes = clientes?.slice(0, 3) || []
  const totalClientes = clientes?.length || 0

  return (
    <div className="space-y-4">
      {/* Header del Widget */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-morph-gray-900 flex items-center gap-2">
            <Store className="h-5 w-5 text-morph-primary-600" />
            Cartera de Clientes
          </h2>
          <p className="text-sm text-morph-gray-600">
            Vista rápida de últimos registrados
          </p>
        </div>
        
        {/* Botón Principal: Ver Todo / Gestionar */}
        <Button 
            onClick={() => setModalCompletoOpen(true)}
            className="group"
            variant="ghost"
        >
            <span className="text-morph-primary-700 font-semibold mr-1">
                Gestión Maestra ({totalClientes})
            </span>
            <ExternalLink className="h-4 w-4 text-morph-primary-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Button>
      </div>

      {/* Grid de Tarjetas Preview (Max 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
             // Skeleton loading simple
             [1,2,3].map(i => (
                 <div key={i} className="h-32 rounded-lg bg-morph-gray-100 animate-pulse"></div>
             ))
        ) : previewClientes.length > 0 ? (
            previewClientes.map((cliente: any) => (
                <Card key={cliente.id} variant="flat" className="p-4 hover:border-morph-primary-200 hover:shadow-sm transition-all cursor-pointer border border-morph-gray-200" onClick={() => setModalCompletoOpen(true)}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                            {cliente.name.charAt(0).toUpperCase()}
                        </div>
                        {cliente.vendedor_id ? (
                            <span className="text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Asignado
                            </span>
                        ) : (
                            <span className="text-[10px] font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                Sin Asignar
                            </span>
                        )}
                    </div>
                    
                    <h3 className="font-bold text-morph-gray-900 truncate" title={cliente.name}>
                        {cliente.name}
                    </h3>
                    
                    {/* Dirección Resumida */}
                    <p className="text-xs text-morph-gray-500 mt-1 line-clamp-2 h-8">
                        {(cliente.street || cliente.colonia) ? (
                            <>📍 {cliente.street} {cliente.numero_exterior} {cliente.colonia}</>
                        ) : 'Sin dirección registrada'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-morph-gray-100 flex justify-between items-center">
                        <span className="text-xs text-morph-gray-400">
                            {new Date(cliente.created_at).toLocaleDateString('es-MX')}
                        </span>
                        <span className="text-xs font-medium text-morph-primary-600 flex items-center group">
                            Ver detalle <ChevronRight className="h-3 w-3 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </Card>
            ))
        ) : (
            <div className="col-span-3 py-8 text-center bg-morph-gray-50 rounded-lg border border-dashed border-morph-gray-300">
                <Users className="h-8 w-8 text-morph-gray-400 mx-auto mb-2" />
                <p className="text-morph-gray-500">No hay clientes recientes.</p>
                <Button variant="link" onClick={() => setModalCompletoOpen(true)}>
                    Registrar el primero
                </Button>
            </div>
        )}

        {/* Action Card si hay pocos clientes */}
        {previewClientes.length > 0 && previewClientes.length < 3 && (
            <div 
                onClick={() => setModalCompletoOpen(true)}
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-morph-gray-200 hover:border-morph-primary-300 hover:bg-morph-primary-50/50 cursor-pointer transition-all h-full min-h-[140px]"
            >
                <div className="w-10 h-10 rounded-full bg-morph-gray-100 flex items-center justify-center mb-2 group-hover:bg-white text-morph-gray-400 group-hover:text-morph-primary-500">
                    <ChevronRight className="h-6 w-6" />
                </div>
                <span className="font-medium text-morph-gray-500 group-hover:text-morph-primary-700">
                    Ver todos los clientes
                </span>
            </div>
        )}
      </div>

      {/* Modal Principal de Gestión Completa */}
      <ModalGestionClientesCompleta 
        isOpen={modalCompletoOpen}
        onClose={() => setModalCompletoOpen(false)}
      />
    </div>
  )
}
