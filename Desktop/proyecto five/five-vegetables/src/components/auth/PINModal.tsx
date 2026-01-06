'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PINModalProps {
  pin: string
  onClose: () => void
  userName: string
}

export function PINModal({ pin, onClose, userName }: PINModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border-4 border-emerald-500 bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Registro Exitoso!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bienvenido, {userName}
          </p>
        </div>

        {/* PIN Display */}
        <div className="mb-6">
          <p className="mb-3 text-center text-sm font-medium text-gray-700">
            Tu PIN de acceso es:
          </p>
          
          <div className="flex justify-center gap-3">
            {pin.split('').map((digit, index) => (
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

        {/* Warning */}
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-center text-sm font-semibold text-amber-800">
            ⚠️ IMPORTANTE
          </p>
          <p className="mt-2 text-center text-xs text-amber-700">
            Este PIN solo se mostrará una vez. Guárdalo en un lugar seguro.
          </p>
          <p className="mt-1 text-center text-xs text-amber-700">
            Lo necesitarás para iniciar sesión.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(pin)
              alert('PIN copiado al portapapeles')
            }}
            variant="secondary"
            className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          >
            📋 Copiar PIN
          </Button>
          
          <Button
            onClick={onClose}
            variant="primary"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Entendido, Continuar
          </Button>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-gray-500">
          También recibirás este PIN por correo electrónico
        </p>
      </div>
    </div>
  )
}
