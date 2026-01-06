'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, RefreshCw, QrCode, X } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

interface User {
  id: string
  full_name: string
  role: string
  phone: string
  pin_code: string
  email?: string
}

export function ListaUsuariosPINs() {
  const supabase = createClient()
  const [revealedPINs, setRevealedPINs] = useState<Set<string>>(new Set())
  const [qrClienteId, setQrClienteId] = useState<string | null>(null)
  const [qrClienteNombre, setQrClienteNombre] = useState<string>('')

  // Obtener vendedores
  const { data: vendedores, refetch: refetchVendedores } = useQuery({
    queryKey: ['vendedores-pins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, pin_code')
        .eq('role', 'vendedor')
        .order('full_name', { ascending: true })

      if (error) throw error
      return data as User[]
    },
  })

  // Obtener clientes
  const { data: clientes, refetch: refetchClientes } = useQuery({
    queryKey: ['clientes-pins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, pin_code')
        .eq('role', 'cliente')
        .order('full_name', { ascending: true })

      if (error) throw error
      return data as User[]
    },
  })

  const toggleRevealPIN = (userId: string) => {
    setRevealedPINs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const copyPIN = (pin: string, nombre: string) => {
    navigator.clipboard.writeText(pin)
    toast.success(`PIN de ${nombre} copiado`)
  }

  const regeneratePIN = async (userId: string, nombre: string) => {
    if (!confirm(`¿Regenerar el PIN de ${nombre}? El PIN anterior dejará de funcionar.`)) return

    const newPIN = Math.floor(1000 + Math.random() * 9000).toString()
    
    const { error } = await supabase
      .from('profiles')
      // @ts-ignore - pin_code not in generated types yet
      .update({ pin_code: newPIN })
      .eq('id', userId)

    if (error) {
      toast.error('Error al regenerar PIN')
      return
    }

    toast.success(`Nuevo PIN generado: ${newPIN}`)
    refetchVendedores()
    refetchClientes()
  }

  return (
    <div className="space-y-6">
      {/* Vendedores */}
      <div className="rounded-lg border border-morph-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-morph-gray-900">
          Vendedores ({vendedores?.length || 0})
        </h3>

        {vendedores && vendedores.length > 0 ? (
          <div className="space-y-2">
            {vendedores.map((vendedor) => {
              const isRevealed = revealedPINs.has(vendedor.id)
              return (
                <div
                  key={vendedor.id}
                  className="flex items-center justify-between rounded-lg border border-morph-gray-100 bg-morph-gray-50 p-3 hover:bg-morph-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-morph-gray-900">
                      {vendedor.full_name}
                    </p>
                    <p className="text-sm text-morph-gray-500">
                      📱 {vendedor.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* PIN Display */}
                    <div className="flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-2">
                      <span className="font-mono text-sm font-bold text-emerald-600">
                        {isRevealed ? vendedor.pin_code : '••••'}
                      </span>
                      <button
                        onClick={() => toggleRevealPIN(vendedor.id)}
                        className="text-gray-400 hover:text-emerald-600 transition-colors"
                        title={isRevealed ? 'Ocultar PIN' : 'Mostrar PIN'}
                      >
                        {isRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Acciones */}
                    {isRevealed && (
                      <>
                        <button
                          onClick={() => copyPIN(vendedor.pin_code, vendedor.full_name)}
                          className="text-emerald-600 hover:text-emerald-700 text-xs font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                        >
                          Copiar
                        </button>
                        <button
                          onClick={() => regeneratePIN(vendedor.id, vendedor.full_name)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          title="Regenerar PIN"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-morph-gray-500">No hay vendedores registrados</p>
        )}
      </div>

      {/* Clientes */}
      <div className="rounded-lg border border-morph-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-morph-gray-900">
          Clientes ({clientes?.length || 0})
        </h3>

        {clientes && clientes.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {clientes.map((cliente) => {
              const isRevealed = revealedPINs.has(cliente.id)
              return (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between rounded-lg border border-morph-gray-100 bg-morph-gray-50 p-3 hover:bg-morph-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-morph-gray-900">
                      {cliente.full_name}
                    </p>
                    <p className="text-sm text-morph-gray-500">
                      📱 {cliente.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* PIN Display */}
                    <div className="flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-2">
                      <span className="font-mono text-sm font-bold text-emerald-600">
                        {isRevealed ? cliente.pin_code : '••••'}
                      </span>
                      <button
                        onClick={() => toggleRevealPIN(cliente.id)}
                        className="text-gray-400 hover:text-emerald-600 transition-colors"
                        title={isRevealed ? 'Ocultar PIN' : 'Mostrar PIN'}
                      >
                        {isRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Acciones */}
                    {isRevealed && (
                      <>
                        <button
                          onClick={() => copyPIN(cliente.pin_code, cliente.full_name)}
                          className="text-emerald-600 hover:text-emerald-700 text-xs font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                        >
                          Copiar
                        </button>
                        <button
                          onClick={() => regeneratePIN(cliente.id, cliente.full_name)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                          title="Regenerar PIN"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setQrClienteId(cliente.id)
                            setQrClienteNombre(cliente.full_name)
                          }}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          title="Ver QR del cliente"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-morph-gray-500">No hay clientes registrados</p>
        )}
      </div>
      
      {/* Modal QR */}
      {qrClienteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border-4 border-emerald-500 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                QR de {qrClienteNombre}
              </h3>
              <button
                onClick={() => setQrClienteId(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border-4 border-emerald-500 bg-white p-4">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : 'https://fivevegetables.com/auth/login'}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#059669"
                />
              </div>
              
              <p className="text-center text-sm text-gray-600">
                El cliente escanea e ingresa su PIN
              </p>
              
              <button
                onClick={() => setQrClienteId(null)}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}