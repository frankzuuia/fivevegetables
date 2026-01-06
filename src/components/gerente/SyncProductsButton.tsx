'use client'

import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { toast } from 'sonner'

export function SyncProductsButton() {
  const [loading, setLoading] = useState(false)
  
  const handleSync = async () => {
    try {
      setLoading(true)
      toast.info('Iniciando sincronización de productos...')
      
      const response = await fetch('/api/sync/products', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`✅ ${data.synced} productos sincronizados`)
        if (data.errors > 0) {
          toast.warning(`⚠️ ${data.errors} productos con errores`)
        }
      } else {
        toast.error(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error syncing products:', error)
      toast.error('Error al sincronizar productos')
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
      {loading ? 'Sincronizando...' : '🔄 Sincronizar Productos desde Odoo'}
    </Button>
  )
}
