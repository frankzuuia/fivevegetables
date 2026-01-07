// =====================================================
// COMPONENT: Modal Gestor Usuarios (PINs & Accesos)
// Gestión centralizada de accesos para Vendedores y Clientes
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { QRCodeSVG } from 'qrcode.react'
import { Eye, EyeOff, RefreshCw, QrCode, Search, Copy, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  full_name: string
  role: string
  phone: string
  pin_code: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  vendedores: User[]
  clientes: User[]
  refetchData: () => void
}

export function GestorUsuariosPINModal({ isOpen, onClose, vendedores, clientes, refetchData }: Props) {
  const [activeTab, setActiveTab] = useState<'vendedores' | 'clientes'>('vendedores')
  const [searchTerm, setSearchTerm] = useState('')
  const [revealedPINs, setRevealedPINs] = useState<Set<string>>(new Set())
  const [qrdata, setQrData] = useState<{id: string, name: string} | null>(null)
  
  const supabase = createClient()

  // Lógica de filtrado según tab activa
  const currentList = activeTab === 'vendedores' ? vendedores : clientes
  const filteredList = currentList?.filter(u => 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.phone?.includes(searchTerm)
  ) || []

  // Acciones PIN
  const toggleRevealPIN = (userId: string) => {
    setRevealedPINs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) newSet.delete(userId)
      else newSet.add(userId)
      return newSet
    })
  }

  const copyPIN = (pin: string, nombre: string) => {
    navigator.clipboard.writeText(pin)
    toast.success(`PIN de ${nombre} copiado`)
  }

  const regeneratePIN = async (userId: string, nombre: string) => {
    if (!confirm(`¿Regenerar PIN de ${nombre}? El anterior dejará de funcionar.`)) return

    const newPIN = Math.floor(1000 + Math.random() * 9000).toString()
    
    // @ts-ignore
    const { error } = await supabase.from('profiles').update({ pin_code: newPIN }).eq('id', userId)

    if (error) {
      toast.error('Error al actualizar PIN')
    } else {
      toast.success(`Nuevo PIN: ${newPIN}`)
      refetchData()
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Accesos y PINs"
      size="lg"
      className="flex flex-col h-[85vh]"
    >
      <div className="flex flex-col h-full space-y-4">
        
        {/* Tabs Generales */}
        <div className="flex bg-morph-gray-100 p-1 rounded-lg shrink-0">
             <button
                onClick={() => { setActiveTab('vendedores'); setSearchTerm('') }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'vendedores' ? 'bg-white text-morph-primary-700 shadow-sm' : 'text-morph-gray-500 hover:text-morph-gray-700'}`}
             >
                <ShieldCheck className="h-4 w-4" />
                Vendedores ({vendedores?.length})
             </button>
             <button
                onClick={() => { setActiveTab('clientes'); setSearchTerm('') }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'clientes' ? 'bg-white text-blue-700 shadow-sm' : 'text-morph-gray-500 hover:text-morph-gray-700'}`}
             >
                <Users className="h-4 w-4" />
                Clientes ({clientes?.length})
             </button>
        </div>

        {/* Buscador */}
        <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-morph-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar ${activeTab}...`}
              className="w-full rounded-lg border border-morph-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-morph-primary-500"
            />
        </div>

        {/* Lista con Scroll */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg-gray-50/50 rounded-lg border border-gray-100 h-full">
            {filteredList.length > 0 ? (
                filteredList.map((user) => {
                    const isRevealed = revealedPINs.has(user.id)
                    return (
                        <div key={user.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between mx-1 my-1">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-morph-gray-900 truncate">{user.full_name}</p>
                                <p className="text-xs text-morph-gray-500 flex items-center gap-1">
                                    📱 {user.phone || 'Sin teléfono'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* PIN Box */}
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 min-w-[100px] justify-between">
                                    <span className={`font-mono font-bold ${isRevealed ? 'text-gray-800' : 'text-gray-400 tracking-widest'}`}>
                                        {isRevealed ? user.pin_code : '••••'}
                                    </span>
                                    <button onClick={() => toggleRevealPIN(user.id)} className="text-gray-400 hover:text-gray-700">
                                        {isRevealed ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </button>
                                </div>

                                {/* Actions */}
                                {isRevealed && (
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => copyPIN(user.pin_code, user.full_name)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Copiar PIN">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => regeneratePIN(user.id, user.full_name)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Regenerar">
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                        {/* Solo clientes suelen necesitar QR para login rápido */}
                                        {activeTab === 'clientes' && (
                                            <button onClick={() => setQrData({id: user.id, name: user.full_name})} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded" title="Ver QR">
                                                <QrCode className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="text-center py-12 text-gray-400">
                    No se encontraron {activeTab}
                </div>
            )}
        </div>

      </div>

      {/* QR Overlay (dentro del modal grande para no perder contexto) */}
      {qrdata && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-morph-xl">
              <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center animate-scale-in max-w-sm w-full mx-4">
                  <h3 className="font-bold text-lg mb-4 text-center">Acceso QR: {qrdata.name}</h3>
                  <div className="p-4 bg-white border-4 border-morph-primary-500 rounded-xl mb-4">
                     <QRCodeSVG
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/login`}
                        size={180}
                        imgSettings={{ src: "", height: 24, width: 24, excavate: true }}
                     />
                  </div>
                  <p className="text-xs text-center text-gray-500 mb-4">Escanea para ir al login directo</p>
                  <Button onClick={() => setQrData(null)} variant="outline" className="w-full">Cerrar QR</Button>
              </div>
          </div>
      )}
    </Modal>
  )
}
