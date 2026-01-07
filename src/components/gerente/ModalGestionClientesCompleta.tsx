// =====================================================
// COMPONENT: Modal Gestión Clientes Completa
// Responsive: Tabla en Desktop / Cards en Mobile
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ModalAsignarVendedor } from './ModalAsignarVendedor'
import { AsignarPriceListModal } from './AsignarPriceListModal'
import { ModalEditarCliente } from './ModalEditarCliente'
import { useAllClientes } from '@/lib/hooks/useClientes'
import { Search, UserCheck, Tag, Pencil, Trash2, MapPin, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ModalGestionClientesCompleta({ isOpen, onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [vendorModalOpen, setVendorModalOpen] = useState(false)
  const [priceListModalOpen, setPriceListModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  
  const { data: clientes, isLoading } = useAllClientes(searchTerm)
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión Maestra de Clientes"
      size="xl"
      className="flex flex-col max-h-[90vh]" // Altura máxima viewport
    >
      <div className="flex flex-col space-y-4">
        
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-end sm:items-center bg-white rounded-lg sticky top-0 z-20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-morph-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-morph-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-morph-primary-500 focus:ring-1 focus:ring-morph-primary-500"
            />
          </div>
          
          <div className="hidden sm:flex text-xs text-morph-gray-500 bg-morph-gray-50 px-3 py-1.5 rounded-full border border-morph-gray-200">
            <span className="font-bold text-morph-gray-900 mr-1">{clientes?.length || 0}</span>
            Clientes
          </div>
        </div>

        {/* CONTENEDOR DE DATOS CON SCROLL */}
        <div className="overflow-y-auto pr-1 h-[60vh] border rounded-lg border-morph-gray-200 bg-gray-50/50">
            
            {/* ============================================== */}
            {/* VISTA DESKTOP (TABLA) - Hidden en Mobile       */}
            {/* ============================================== */}
            <div className="hidden md:block">
              <table className="w-full text-sm text-left">
                <thead className="bg-morph-gray-100 text-morph-gray-600 font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 w-[40%]">Cliente / Dirección</th>
                    <th className="px-4 py-3 w-[20%]">Datos</th>
                    <th className="px-4 py-3 w-[15%]">Config</th>
                    <th className="px-4 py-3 w-[25%] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-morph-gray-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-morph-gray-500">Cargando...</td></tr>
                  ) : clientes && clientes.length > 0 ? (
                    clientes.map((cliente: any) => (
                      <tr key={cliente.id} className="hover:bg-morph-gray-50/80 transition-colors">
                        <td className="px-4 py-3 align-top">
                           <div className="font-bold text-morph-gray-900 text-base">{cliente.name}</div>
                           
                           {/* Dirección en tabla */}
                           <div className="mt-1 flex items-start gap-1 text-xs text-morph-gray-600 leading-snug max-w-xs break-words whitespace-normal">
                                <span className="shrink-0">📍</span>
                                <div>
                                    {cliente.street || cliente.colonia ? (
                                        <>
                                            <span className="font-medium">{cliente.street} {cliente.numero_exterior}</span>
                                            <div className="text-morph-gray-500">{cliente.colonia} {cliente.ciudad}</div>
                                        </>
                                    ) : <span className="italic text-gray-400">Sin dirección</span>}
                                </div>
                           </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1.5">
                                {/* Vendedor Badge */}
                                {cliente.vendedor_name ? (
                                    <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                                        <UserCheck className="h-3.5 w-3.5" />
                                        <span className="truncate max-w-[120px]" title={cliente.vendedor_name}>{cliente.vendedor_name}</span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-yellow-700 font-bold flex items-center gap-1">
                                        ⚠️ Sin Vendedor
                                    </div>
                                )}
                                {/* Phone */}
                                <div className="text-xs text-morph-gray-500 flex items-center gap-1.5">
                                    <Phone className="h-3 w-3" />
                                    {cliente.phone || '-'}
                                </div>
                            </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                             <div className="flex flex-col gap-1">
                                {/* Tarifa Badge */}
                                {cliente.pricelist_name ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 w-fit">
                                        💰 {cliente.pricelist_name}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-gray-400">Tarifa Base</span>
                                )}
                                {/* Fecha */}
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(cliente.created_at)}
                                </span>
                             </div>
                        </td>

                        <td className="px-4 py-3 align-top text-center">
                            <div className="flex justify-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedCliente(cliente); setVendorModalOpen(true); }} title="Asignar Vendedor" className="h-8 w-8 p-0 text-morph-gray-600 hover:text-morph-primary-600 hover:bg-morph-primary-50">
                                    {cliente.vendedor_id ? '🔄' : '👤'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedCliente(cliente); setPriceListModalOpen(true); }} title="Tarifa" className="h-8 w-8 p-0 text-morph-gray-600 hover:text-purple-600 hover:bg-purple-50">
                                    <Tag className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedCliente(cliente); setEditModalOpen(true); }} title="Editar" className="h-8 w-8 p-0 text-morph-gray-600 hover:text-blue-600 hover:bg-blue-50">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={async () => {
                                     if (confirm(`¿Eliminar a ${cliente.name}?`)) {
                                         const { deleteCliente } = await import('@/app/actions/clientes');
                                         await deleteCliente(cliente.id);
                                         window.location.reload();
                                     }
                                }} title="Eliminar" className="h-8 w-8 p-0 text-morph-gray-600 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-8 text-center text-morph-gray-500">No se encontraron clientes</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ============================================== */}
            {/* VISTA MÓVIL (CARDS) - Visible solo en Mobile   */}
            {/* ============================================== */}
            <div className="md:hidden space-y-3 p-3">
              {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : clientes && clientes.length > 0 ? (
                  clientes.map((cliente: any) => (
                    <div key={cliente.id} className="bg-white rounded-lg p-4 border border-morph-gray-200 shadow-sm space-y-3">
                        {/* Cabecera Card */}
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-morph-gray-900 text-lg">{cliente.name}</h3>
                                <div className="text-xs text-morph-gray-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Reg: {formatDate(cliente.created_at)}
                                </div>
                             </div>
                             {/* Botón Eliminar Móvil (esquina) */}
                             <button 
                                onClick={async () => {
                                     if (confirm(`¿Eliminar a ${cliente.name}?`)) {
                                         const { deleteCliente } = await import('@/app/actions/clientes');
                                         await deleteCliente(cliente.id);
                                         window.location.reload();
                                     }
                                }}
                                className="p-2 text-gray-400 hover:text-red-500"
                             >
                                <Trash2 className="h-4 w-4" />
                             </button>
                        </div>
                        
                        {/* Info Principal */}
                        <div className="space-y-2 bg-gray-50 p-3 rounded-md text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-morph-primary-500 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-800">{cliente.street} {cliente.numero_exterior}</p>
                                    <p className="text-xs text-gray-500">{cliente.colonia} {cliente.ciudad}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-green-600 shrink-0" />
                                <span className="text-gray-700">{cliente.phone || 'Sin teléfono'}</span>
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex gap-2 flex-wrap">
                             {cliente.vendedor_name ? (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                    👤 {cliente.vendedor_name}
                                </span>
                             ) : (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">
                                    ⚠️ Sin Vendedor
                                </span>
                             )}
                             {cliente.pricelist_name ? (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                                    💰 {cliente.pricelist_name}
                                </span>
                             ) : null}
                        </div>

                        {/* Botones de Acción Móvil */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setSelectedCliente(cliente); setVendorModalOpen(true); }}
                                className="w-full text-xs h-9"
                             >
                                {cliente.vendedor_id ? 'Cambiar Vend.' : 'Asignar Vend.'}
                             </Button>
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setSelectedCliente(cliente); setPriceListModalOpen(true); }}
                                className="w-full text-xs h-9"
                             >
                                Tarifa
                             </Button>
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setSelectedCliente(cliente); setEditModalOpen(true); }}
                                className="w-full text-xs h-9"
                             >
                                Editar
                             </Button>
                        </div>
                    </div>
                  ))
              ) : (
                  <div className="text-center py-8">No hay clientes</div>
              )}
            </div>

        </div>
      </div>

      {/* MODALES INTERNOS */}
      {vendorModalOpen && selectedCliente && (
        <ModalAsignarVendedor
          cliente={selectedCliente}
          onClose={() => setVendorModalOpen(false)}
          onSuccess={() => { setVendorModalOpen(false); window.location.reload(); }}
        />
      )}
      
      {priceListModalOpen && selectedCliente && (
        <AsignarPriceListModal
          cliente={selectedCliente}
          onClose={() => setPriceListModalOpen(false)}
          onSuccess={() => { setPriceListModalOpen(false); window.location.reload(); }}
        />
      )}

      {editModalOpen && selectedCliente && (
        <ModalEditarCliente
          cliente={selectedCliente}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </Modal>
  )
}
