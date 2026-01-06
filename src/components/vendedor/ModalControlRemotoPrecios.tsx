// =====================================================
// COMPONENT: Modal Control Remoto de Precios
// LA JOYA - Cambiar tarifa cliente desde móvil (Dashboard Vendedor)
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { updateClientPricelist } from '@/app/actions/prices'
import { AlertTriangle, DollarSign, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'

interface PriceList {
  id: string
  name: string
  type: string
  discount_percentage: number
}

interface ModalControlRemotoPreciosProps {
  clienteId: string
  clienteName: string
  currentPricelistId: string | null
  onClose: () => void
  onSuccess?: () => void
}

export function ModalControlRemotoPrecios({
  clienteId,
  clienteName,
  currentPricelistId,
  onClose,
  onSuccess,
}: ModalControlRemotoPreciosProps) {
  const supabase = createClient()
  const [pricelists, setPricelists] = useState<PriceList[]>([])
  const [currentPricelist, setCurrentPricelist] = useState<PriceList | null>(null)
  const [selectedPricelistId, setSelectedPricelistId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    fetchPricelists()
  }, [])
  
  const fetchPricelists = async () => {
    try {
      setLoading(true)
      
      // Get user store_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()
      
      if (!profile) return
      
      // Fetch all pricelists del store
      const { data, error } = await supabase
        .from('price_lists')
        .select('id, name, type, discount_percentage')
        .eq('store_id', (profile as any).store_id)
        .order('name')
      
      if (error) throw error
      
      setPricelists(data || [])
      
      // Set current pricelist
      if (currentPricelistId) {
        const current = (data as any)?.find((p: any) => p.id === currentPricelistId)
        if (current) {
          setCurrentPricelist(current)
          setSelectedPricelistId((current as any).id)
        }
      }
    } catch (error) {
      console.error('[Fetch Pricelists Error]', error)
      toast.error('Error al cargar tarifas')
    } finally {
      setLoading(false)
    }
  }
  
  const selectedPricelist = pricelists.find(p => p.id === selectedPricelistId)
  const hasChanges = selectedPricelistId && selectedPricelistId !== currentPricelistId
  
  const handleSubmit = async () => {
    if (!selectedPricelistId || !hasChanges) return
    
    try {
      setSubmitting(true)
      
      const result = await updateClientPricelist({
        clienteId,
        newPricelistId: selectedPricelistId,
      })
      
      if (!result.success) {
        toast.error(result.error)
        return
      }
      
      toast.success(`✨ Tarifa actualizada para ${clienteName}`)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('[Update Pricelist Error]', error)
      toast.error('Error al actualizar tarifa')
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Modal isOpen={true} size="md" onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-morph-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-morph-gray-900">
            🎛️ Control Remoto de Precios
          </h2>
          <p className="mt-1 text-sm text-morph-gray-600">
            {clienteName}
          </p>
        </div>
        
        {/* Warning Alert */}
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-600" />
            <div className="text-sm">
              <p className="font-semibold text-orange-900">Importante</p>
              <p className="mt-1 text-orange-700">
                El cambio de tarifa es <strong>INMEDIATO</strong>. El cliente verá los nuevos
                precios la próxima vez que abra el catálogo.
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        {loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-morph-primary-200 border-t-morph-primary-600" />
            <p className="mt-4 text-morph-gray-600">Cargando tarifas...</p>
          </div>
        ) : (
          <>
            {/* Tarifa Actual */}
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Tarifa Actual
              </label>
              <div className="rounded-lg border border-morph-gray-200 bg-morph-gray-50 p-4">
                {currentPricelist ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-morph-gray-900">
                        {currentPricelist.name}
                      </p>
                      <p className="text-sm text-morph-gray-600">
                        {currentPricelist.type} • {currentPricelist.discount_percentage}% descuento
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 px-3 py-1">
                      <span className="text-xs font-medium text-green-700">Activa</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-morph-gray-600">Sin tarifa asignada</p>
                )}
              </div>
            </div>
            
            {/* Nueva Tarifa Selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Nueva Tarifa
              </label>
              <select
                value={selectedPricelistId}
                onChange={(e) => setSelectedPricelistId(e.target.value)}
                className="w-full rounded-lg border border-morph-gray-300 bg-white px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-morph-primary-500"
                disabled={submitting}
              >
                <option value="">-- Seleccionar tarifa --</option>
                {pricelists.map((pricelist) => (
                  <option key={pricelist.id} value={pricelist.id}>
                    {pricelist.name} ({pricelist.discount_percentage}% desc.)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Preview Cambio */}
            {hasChanges && selectedPricelist && currentPricelist && (
              <div className="rounded-lg border-2 border-morph-primary-200 bg-morph-primary-50 p-4">
                <p className="mb-3 text-sm font-semibold text-morph-primary-900">
                  <Check className="mb-1 mr-1 inline h-4 w-4" />
                  Vista Previa del Cambio
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-morph-gray-600">Antes</p>
                    <p className="font-medium text-morph-gray-900">
                      {currentPricelist.discount_percentage}% descuento
                    </p>
                  </div>
                  
                  <ArrowRight className="mx-4 h-5 w-5 flex-shrink-0 text-morph-primary-600" />
                  
                  <div className="flex-1 text-right">
                    <p className="text-xs text-morph-gray-600">Después</p>
                    <p className="font-bold text-morph-primary-700">
                      {selectedPricelist.discount_percentage}% descuento
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Actions */}
        <div className="flex gap-3 border-t border-morph-gray-200 pt-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-morph-gray-300 bg-white px-4 py-3 font-medium text-morph-gray-700 transition-colors hover:bg-morph-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hasChanges || submitting}
            className="flex-1 rounded-lg bg-gradient-to-r from-morph-primary-600 to-morph-primary-700 px-4 py-3 font-medium text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Aplicando...
              </span>
            ) : (
              '✨ Aplicar Cambio'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
