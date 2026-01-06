'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { useCartStore } from '@/lib/stores/cart'

export function HydrationWrapper({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  const setAuthHydrated = useAuthStore((state) => state.setHydrated)
  const setCartHydrated = useCartStore((state) => state.setHydrated)
  
  useEffect(() => {
    // Marcar stores como hidratados después del mount
    setAuthHydrated(true)
    setCartHydrated(true)
    setIsHydrated(true)
  }, [setAuthHydrated, setCartHydrated])
  
  // Evitar hydration mismatch mostrando loading hasta que client esté listo
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-morph-bg">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-morph-primary-500 border-t-transparent"></div>
          <p className="text-morph-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}
