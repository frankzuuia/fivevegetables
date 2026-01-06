'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { z } from 'zod'
import { X } from 'lucide-react'

const CreateVendedorSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombreCompleto: z.string().min(1, 'Nombre requerido'),
  telefono: z.string().regex(/^\d{10}$/, 'Teléfono 10 dígitos'),
})

export function CrearVendedorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    telefono: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPIN, setShowPIN] = useState(false)
  const [generatedPIN, setGeneratedPIN] = useState('')
  const [vendedorNombre, setVendedorNombre] = useState('')
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validar
      const validated = CreateVendedorSchema.parse(formData)
      
      // Llamar al server action
      const { createVendedor } = await import('@/app/actions/vendedores')
      const result = await createVendedor(validated)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Mostrar PIN generado
      if (result.pin) {
        setGeneratedPIN(result.pin)
        setVendedorNombre(formData.nombreCompleto)
        setShowPIN(true)
      } else {
        toast.success('✅ Vendedor creado exitosamente')
        onSuccess()
        onClose()
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const field = issue.path[0] as string
          newErrors[field] = issue.message
        })
        setErrors(newErrors)
      } else {
        toast.error(error instanceof Error ? error.message : 'Error al crear vendedor')
      }
        } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {showPIN ? (
          // Vista de PIN Generado  
          <>
            <div className="mb-6 text-center">
              <div className="mb-4 text-5xl">✅</div>
              <h2 className="text-2xl font-bold text-morph-gray-900">
                Vendedor Creado
              </h2>
              <p className="mt-2 text-sm text-morph-gray-600">
                {vendedorNombre}
              </p>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-center text-sm font-medium text-morph-gray-700">
                PIN de acceso generado:
              </p>
              
              <div className="flex justify-center gap-3">
                {generatedPIN.split('').map((digit, index) => (
                  <div
                    key={index}
                    className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-50"
                  >
                    <span className="text-3xl font-bold text-emerald-600">
                      {digit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-center text-sm font-semibold text-amber-800">
                ⚠️ IMPORTANTE
              </p>
              <p className="mt-2 text-center text-xs text-amber-700">
                Comparte este PIN con el vendedor para que pueda iniciar sesión
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPIN)
                  toast.success('PIN copiado al portapapeles')
                }}
                variant="secondary"
                className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                📋 Copiar PIN
              </Button>
              
              <Button
                onClick={() => {
                  onSuccess()
                  onClose()
                }}
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Entendido
              </Button>
            </div>
          </>
        ) : (
          // Vista de Formulario
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-morph-gray-900">
                Crear Vendedor
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-morph-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="vendedor@fivevegetables.com"
                  error={errors.email}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Contraseña Temporal *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  error={errors.password}
                />
                <p className="mt-1 text-xs text-morph-gray-500">
                  El vendedor podrá cambiarla después
                </p>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Nombre Completo *
                </label>
                <Input
                  value={formData.nombreCompleto}
                  onChange={(e) => updateField('nombreCompleto', e.target.value)}
                  placeholder="Carlos López"
                  error={errors.nombreCompleto}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Teléfono *
                </label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder="3312345678"
                  maxLength={10}
                  error={errors.telefono}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creando...' : 'Crear Vendedor'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
export function CrearVendedorButton() {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="primary"
      >
        + Crear Vendedor
      </Button>
      
      {showModal && (
        <CrearVendedorModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            // Refresh la lista de vendedores si es necesario
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
