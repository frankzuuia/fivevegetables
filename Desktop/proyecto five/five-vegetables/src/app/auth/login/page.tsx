'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PINLoginPage() {
  const router = useRouter()
  const [pinInput, setPinInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePinInput = (digit: string) => {
    if (pinInput.length < 4 && !loading) {
      const newPin = pinInput + digit
      setPinInput(newPin)
      
      // Auto-login cuando se completan 4 dígitos
      if (newPin.length === 4) {
        handleLogin(newPin)
      }
    }
  }

  const handleBackspace = () => {
    if (!loading) {
      setPinInput((prev) => prev.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (!loading) {
      setPinInput('')
    }
  }

  const handleLogin = async (pin: string) => {
    setLoading(true)

    try {
      // Llamar server action
      const { loginWithPIN } = await import('@/app/actions/auth')
      const result = await loginWithPIN(pin)

      if (!result.success) {
        toast.error(result.error || 'PIN incorrecto')
        setPinInput('')
        setLoading(false)
        return
      }

      // Éxito - navegar a sessionUrl que establece la sesión
      toast.success(`¡Bienvenido ${result.user!.name}!`)
      window.location.href = result.sessionUrl!
      
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Error al iniciar sesión')
      setPinInput('')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4">
      {/* Glow effect background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Panel Principal - Neumorfismo */}
        <div className="bg-white rounded-3xl p-8 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] border border-emerald-200/50">
          
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-inner">
                <span className="text-4xl">🥬</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Five Vegetables
            </h1>
            <p className="text-sm text-gray-500">
              Ingresa tu PIN de 4 dígitos
            </p>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200
                  ${
                    pinInput.length > index
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border-2 border-emerald-600'
                      : 'bg-white shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] border-2 border-emerald-100'
                  }
                `}
              >
                {pinInput[index] ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Teclado Numérico */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinInput(num.toString())}
                disabled={loading}
                className="
                  h-16 rounded-xl text-xl font-semibold text-gray-700
                  bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)]
                  hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]
                  active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]
                  border border-emerald-100
                  transition-all duration-150
                  disabled:opacity-50
                "
              >
                {num}
              </button>
            ))}

            {/* Botón Limpiar */}
            <button
              onClick={handleClear}
              disabled={loading}
              className="
                h-16 rounded-xl text-xs font-medium text-gray-500
                bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)]
                hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05)]
                active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]
                border border-gray-200
                transition-all duration-150
                disabled:opacity-50
              "
            >
              Limpiar
            </button>

            {/* Botón 0 */}
            <button
              onClick={() => handlePinInput('0')}
              disabled={loading}
              className="
                h-16 rounded-xl text-xl font-semibold text-gray-700
                bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)]
                hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.9)]
                active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]
                border border-emerald-100
                transition-all duration-150
                disabled:opacity-50
              "
            >
              0
            </button>

            {/* Botón Backspace */}
            <button
              onClick={handleBackspace}
              disabled={loading}
              className="
                h-16 rounded-xl text-xl font-medium text-gray-500
                bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)]
                hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05)]
                active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)]
                border border-gray-200
                transition-all duration-150
                disabled:opacity-50
              "
            >
              ⌫
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-400">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-emerald-600 font-medium hover:text-emerald-700"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}