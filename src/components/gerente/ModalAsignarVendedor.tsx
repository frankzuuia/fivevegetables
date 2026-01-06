// =====================================================
// COMPONENT: Modal Asignar Vendedor
// Gerente asigna vendedor + tarifa a cliente nuevo
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAsignarVendedor, useVendedores } from '@/lib/hooks/useClientes'
import { usePriceLists } from '@/lib/hooks/usePricelist'
import { toast } from 'sonner'

interface ModalAsignarVendedorProps {
  cliente: {
    id: string
    name: string
    email: string
    phone: string
    store_id: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function ModalAsignarVendedor({
  cliente,
  onClose,
  onSuccess,
}: ModalAsignarVendedorProps) {
  const [vendedorId, setVendedorId] = useState('')
  const [pricelistId, setPricelistId] = useState('')
  
  // Fetch vendedores del store
  const { data: vendedores, isLoading: loadingVendedores } = useVendedores(
    cliente.store_id
  )
  
  // Fetch pricelists del store
  const { data: pricelists, isLoading: loadingPricelists } = usePriceLists(
    cliente.store_id
  )
  
  const asignarMutation = useAsignarVendedor()
  
  const handleSubmit = async () => {
    if (!vendedorId) {
      toast.error('Debes seleccionar un vendedor')
      return
    }
    
    if (!pricelistId) {
      toast.error('Debes seleccionar una tarifa')
      return
    }
    
    try {
      await asignarMutation.mutateAsync({
        clienteId: cliente.id,
        vendedorId,
        pricelistId,
      })
      
      toast.success(`Vendedor asignado a ${cliente.name}`)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al asignar vendedor'
      )
    }
  }
  
  return (
    <Modal isOpen onClose={onClose} size="md">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-morph-gray-900">
            Asignar Vendedor
          </h2>
          <p className="mt-2 text-sm text-morph-gray-600">
            Cliente: <span className="font-semibold">{cliente.name}</span>
          </p>
          <p className="text-sm text-morph-gray-600">{cliente.email}</p>
        </div>
        
        {/* Selección Vendedor */}
        <div>
          <label
            htmlFor="vendedor-select"
            className="block text-sm font-medium text-morph-gray-700 mb-2"
          >
            Vendedor Asignado *
          </label>
          <select
            id="vendedor-select"
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            disabled={loadingVendedores}
            className="w-full px-4 py-3 border border-morph-gray-300 rounded-lg focus:ring-2 focus:ring-morph-primary-500 focus:border-transparent transition-all"
          >
            <option value="">
              {loadingVendedores ? 'Cargando...' : 'Seleccionar vendedor'}
            </option>
            {vendedores?.map((vendedor: any) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.full_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Selección Tarifa */}
        <div>
          <label
            htmlFor="pricelist-select"
            className="block text-sm font-medium text-morph-gray-700 mb-2"
          >
            Tarifa de Precio *
          </label>
          <select
            id="pricelist-select"
            value={pricelistId}
            onChange={(e) => setPricelistId(e.target.value)}
            disabled={loadingPricelists}
            className="w-full px-4 py-3 border border-morph-gray-300 rounded-lg focus:ring-2 focus:ring-morph-primary-500 focus:border-transparent transition-all"
          >
            <option value="">
              {loadingPricelists ? 'Cargando...' : 'Seleccionar tarifa'}
            </option>
            {pricelists?.map((pricelist: any) => (
              <option key={pricelist.id} value={pricelist.id}>
                {pricelist.name} ({pricelist.type}) -{' '}
                {pricelist.discount_percentage}% descuento
              </option>
            ))}
          </select>
        </div>
        
        {/* Información */}
        <div className="bg-morph-primary-50 border border-morph-primary-200 rounded-lg p-4">
          <p className="text-sm text-morph-primary-800">
            ℹ️ Al asignar, el cliente podrá hacer pedidos con los precios de la
            tarifa seleccionada.
          </p>
        </div>
        
        {/* Botones */}
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="flex-1"
            disabled={asignarMutation.isPending || !vendedorId || !pricelistId}
          >
            {asignarMutation.isPending ? 'Asignando...' : '✅ Asignar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
