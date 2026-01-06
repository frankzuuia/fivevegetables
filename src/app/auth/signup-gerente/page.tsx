// =====================================================
// PAGE: Signup Gerente/Admin
// Registro inicial del dueño del negocio
// =====================================================

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { PINModal } from '@/components/auth/PINModal'

const SignupGerenteSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombreCompleto: z.string().min(1, 'Nombre requerido'),
  telefono: z.string().regex(/^\d{10}$/, 'Teléfono 10 dígitos'),
  nombreNegocio: z.string().min(1, 'Nombre del negocio requerido'),
})

export default function SignupGerentePage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    telefono: '',
    nombreNegocio: '',
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
      const validated = SignupGerenteSchema.parse(formData)
      
      // Llamar server action
      const { signupGerente } = await import('@/app/actions/signup')
      const result = await signupGerente(validated)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Mostrar PIN en modal
      if (result.pin) {
        setGeneratedPIN(result.pin)
        setShowPINModal(true)
      } else {
        toast.success('¡Cuenta de gerente creada exitosamente!')
        router.push('/dashboard/gerente')
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
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-morph-gray-900">
            Registro Gerente
          </h1>
          <p className="mt-2 text-morph-gray-600">
            Crea tu cuenta como administrador del negocio
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6 rounded-lg border border-morph-gray-200 bg-white p-8 shadow-lg">
          <div>
            <label className="mb-2 block text-sm font-medium text-morph-gray-700">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="admin@fivevegetables.com"
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
              Nombre del Negocio *
            </label>
            <Input
              value={formData.nombreNegocio}
              onChange={(e) => updateField('nombreNegocio', e.target.value)}
              placeholder="Five Vegetables"
              error={errors.nombreNegocio}
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
                    >
            {loading ? 'Registrando...' : 'Crear Cuenta de Gerente'}
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
            router.push('/dashboard/gerente')
          }}
        />
      )}
    </div>
  )
}
