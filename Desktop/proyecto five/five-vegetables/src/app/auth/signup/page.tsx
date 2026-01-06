// =====================================================
// PAGE: Signup Cliente
// Auto-registro cliente usando server action
// =====================================================

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { PINModal } from '@/components/auth/PINModal'

const SignupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombreCompleto: z.string().min(1, 'Nombre requerido'),
  telefono: z.string().regex(/^\d{10}$/, 'Teléfono 10 dígitos'),
  restaurant: z.string().min(1, 'Nombre restaurant requerido'),
  calle: z.string().min(1, 'Calle requerida'),
  numeroExterior: z.string().min(1, 'Número requerido'),
  entreCalles: z.string().optional(),
  colonia: z.string().min(1, 'Colonia requerida'),
  codigoPostal: z.string().regex(/^\d{5}$/, 'CP 5 dígitos'),
})

export default function SignupPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    telefono: '',
    restaurant: '',
    calle: '',
    numeroExterior: '',
    entreCalles: '',
    colonia: '',
    codigoPostal: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPINModal, setShowPINModal] = useState(false)
  const [generatedPIN, setGeneratedPIN] = useState('')
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validación client-side
      const validated = SignupSchema.parse(formData)
      
      // Llamar server action
      const { signupCliente } = await import('@/app/actions/signup')
      const result = await signupCliente(validated)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Mostrar PIN en modal
      if (result.pin) {
        setGeneratedPIN(result.pin)
        setShowPINModal(true)
      } else {
        toast.success('¡Registro exitoso!')
        router.push('/dashboard/cliente')
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
        toast.error(error instanceof Error ? error.message : 'Error al registrarse')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-morph-primary-50 to-white py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-morph-gray-900">
            Registro Cliente
          </h1>
          <p className="mt-2 text-morph-gray-600">
            Completa tus datos para comenzar a ordenar
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6 rounded-lg border border-morph-gray-200 bg-white p-8 shadow-lg">
          {/* Sección Cuenta */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-morph-gray-800">
              🔐 Datos de Cuenta
            </h2>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="tu@restaurant.com"
                error={errors.email}
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Contraseña (mínimo 6 caracteres) *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="••••••••"
                error={errors.password}
              />
            </div>
          </div>
          
          {/* Sección Personal */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-morph-gray-800">
              👤 Información Personal
            </h2>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Nombre Completo *
              </label>
              <Input
                value={formData.nombreCompleto}
                onChange={(e) => updateField('nombreCompleto', e.target.value)}
                placeholder="Juan Pérez"
                error={errors.nombreCompleto}
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Teléfono (10 dígitos) *
              </label>
              <Input
                value={formData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                placeholder="3312345678"
                maxLength={10}
                error={errors.telefono}
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Nombre del Restaurant *
              </label>
              <Input
                value={formData.restaurant}
                onChange={(e) => updateField('restaurant', e.target.value)}
                placeholder="Restaurant El Buen Sabor"
                error={errors.restaurant}
              />
            </div>
          </div>
          
          {/* Sección Dirección */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-morph-gray-800">
              📍 Dirección
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Calle *
                </label>
                <Input
                  value={formData.calle}
                  onChange={(e) => updateField('calle', e.target.value)}
                  placeholder="Av. Juárez"
                  error={errors.calle}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Número Ext *
                </label>
                <Input
                  value={formData.numeroExterior}
                  onChange={(e) => updateField('numeroExterior', e.target.value)}
                  placeholder="123"
                  error={errors.numeroExterior}
                />
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Entre Calles (opcional)
              </label>
              <Input
                value={formData.entreCalles}
                onChange={(e) => updateField('entreCalles', e.target.value)}
                placeholder="Entre Av. Hidalgo y Calle Morelos"
                error={errors.entreCalles}
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Colonia *
                </label>
                <Input
                  value={formData.colonia}
                  onChange={(e) => updateField('colonia', e.target.value)}
                  placeholder="Centro"
                  error={errors.colonia}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Código Postal (5 dígitos) *
                </label>
                <Input
                  value={formData.codigoPostal}
                  onChange={(e) => updateField('codigoPostal', e.target.value)}
                  placeholder="44100"
                  maxLength={5}
                  error={errors.codigoPostal}
                />
              </div>
            </div>
          </div>
          
          {/* Info */}
          <div className="rounded-lg bg-morph-primary-50 p-4">
            <p className="text-sm text-morph-gray-700">
              <span className="font-semibold">ℹ️ Nota:</span> Tu cuenta será revisada y se te asignará un vendedor. Una vez asignado, podrás ver el catálogo y realizar pedidos.
            </p>
          </div>
          
          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </Button>
          
          <p className="text-center text-sm text-morph-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="font-medium text-morph-primary-600 hover:underline"
            >
              Inicia sesión
            </button>
          </p>
                </form>
      </div>
      
      {/* Modal de PIN */}
      {showPINModal && generatedPIN && (
        <PINModal
          pin={generatedPIN}
          userName={formData.nombreCompleto}
          onClose={() => {
            setShowPINModal(false)
            router.push('/dashboard/cliente')
          }}
        />
      )}
    </div>
  )
}
