'use client'

import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { toast } from 'sonner'

export function SyncProductsButton() {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    try {
      setLoading(true)
      toast.info('Sincronizando productos y listas de precios desde Odoo...')

      // 1. Sincronizar productos
      const productsResponse = await fetch('/api/sync/products', {
        method: 'POST',
      })

      const productsData = await productsResponse.json()

      // 2. Sincronizar listas de precios
      const pricelistsResponse = await fetch('/api/odoo/sync-pricelists', {
        method: 'POST',
        credentials: 'include',
      })

      const pricelistsData = await pricelistsResponse.json()

      // Mostrar resultados combinados
      if (productsData.success && pricelistsData.success) {
        toast.success(
          `✅ ${productsData.synced} productos, ${pricelistsData.pricelists} listas de precios sincronizadas`
        )
        if (productsData.errors > 0) {
          toast.warning(`⚠️ ${productsData.errors} productos con errores`)
        }
      } else {
        if (!productsData.success) {
          toast.error(`Error en productos: ${productsData.error}`)
        }
        if (!pricelistsData.success) {
          toast.error(`Error en listas: ${pricelistsData.error}`)
        }
      }
    } catch (error) {
      console.error('Error syncing from Odoo:', error)
      toast.error('Error al sincronizar desde Odoo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={loading}
      variant="primary"
    >
      {loading ? 'Sincronizando...' : '🔄 Sincronizar desde Odoo'}
    </Button>
  )
}
