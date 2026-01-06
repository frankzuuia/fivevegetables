// =====================================================
// PAGE: Mi Cartera (Dashboard Vendedor)
// Vista detallada de clientes asignados (Sub-route)
// =====================================================

'use client'

import { MiCartera } from '@/components/vendedor/MiCartera'

export default function MiCarteraPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="mx-auto max-w-7xl">
        <MiCartera />
      </div>
    </div>
  )
}
