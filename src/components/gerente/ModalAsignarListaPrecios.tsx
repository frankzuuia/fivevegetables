// =====================================================
// MODAL: Asignar Lista de Precios a Cliente
// Selector dropdown con todas las listas disponibles
// =====================================================

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X, Tag, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PriceList } from '@/types/database'

interface Props {
  cliente: {
    id: string
    name: string
    pricelist_id?: string
    pricelist_name?: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function ModalAsignarListaPrecios({ cliente, onClose, onSuccess }: Props) {
  const [selectedPriceListId, setSelectedPriceListId] = useState(cliente.pricelist_id || '')
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch available price lists
  const priceListsQuery = useQuery({
    queryKey: ['price-lists'],
    queryFn: async (): Promise<PriceList[]> => {
      const { data, error } = await supabase
        .from('price_lists')
        .select('*')
        .order('name')

      if (error) throw error
      return (data || []) as PriceList[]
    },
  })

  const priceLists: PriceList[] = priceListsQuery.data || []

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async (priceListId: string) => {
      const { assignPriceListToClient } = await import('@/app/actions/products')
      return assignPriceListToClient({
        clientId: cliente.id,
        priceListId,
      })
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['clientes'] })
        queryClient.invalidateQueries({ queryKey: ['all-clientes'] })
        onSuccess()
      } else {
        toast.error(result.error)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPriceListId) {
      toast.error('Selecciona una lista de precios')
      return
    }

    assignMutation.mutate(selectedPriceListId)
  }

  const selectedList: PriceList | undefined = priceLists.find(
    (list: PriceList) => list.id === selectedPriceListId
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-morph-gray-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-morph-gray-900">
              Asignar Lista de Precios
            </h2>
            <p className="mt-1 text-sm text-morph-gray-600">
              {cliente.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-morph-gray-400 transition-colors hover:bg-morph-gray-100 hover:text-morph-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Price List */}
          {cliente.pricelist_name && (
            <div className="mb-4 rounded-lg bg-morph-gray-50 p-4">
              <p className="text-sm font-medium text-morph-gray-700">
                Lista Actual:
              </p>
              <p className="mt-1 font-semibold text-morph-primary-600">
                {cliente.pricelist_name}
              </p>
            </div>
          )}

          {/* Select Price List */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-morph-gray-700">
              Seleccionar Lista de Precios
            </label>
            <select
              value={selectedPriceListId}
              onChange={(e) => setSelectedPriceListId(e.target.value)}
              required
              className="w-full rounded-lg border border-morph-gray-300 px-4 py-3 focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
            >
              <option value="">-- Seleccionar --</option>
              {priceLists.map((list: PriceList) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.type}) - {list.discount_percentage}% desc.
                </option>
              ))}
            </select>
          </div>

          {/* Preview Selected */}
          {selectedList && (
            <div className="mb-6 rounded-lg border-2 border-morph-primary-200 bg-morph-primary-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-morph-primary-600 text-white">
                  <Tag className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-morph-gray-900">{selectedList.name}</p>
                  <p className="text-sm text-morph-gray-600 capitalize">{selectedList.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-morph-primary-600" />
                  <span className="text-2xl font-bold text-morph-primary-600">
                    {selectedList.discount_percentage}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Esta acción actualizará la lista de precios del cliente en Odoo inmediatamente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={assignMutation.isPending || !selectedPriceListId}
            >
              {assignMutation.isPending ? 'Asignando...' : 'Asignar Lista'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={assignMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
