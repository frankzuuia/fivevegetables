// =====================================================
// COMPONENT: Gestor de Listas de Precios (Gerente)
// CRUD completo con sincronización Odoo
//  =====================================================

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Tag, DollarSign, List } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ModalReglasListaPrecios } from './ModalReglasListaPrecios'

interface PriceList {
  id: string
  name: string
  type: string
  discount_percentage: number
  odoo_pricelist_id: number
  created_at: string
}

export function GestorListasPrecios() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingList, setEditingList] = useState<PriceList | null>(null)
  const [rulesModalOpen, setRulesModalOpen] = useState(false)
  const [selectedListForRules, setSelectedListForRules] = useState<PriceList | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'mayorista' as 'mayorista' | 'minorista' | 'especial',
    discountPercentage: 0,
  })

  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch products for rules modal
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products/list')
      if (!response.ok) throw new Error('Error al cargar productos')
      const data = await response.json()
      return data.products || []
    },
  })

  // Fetch price lists
  const { data: priceLists, isLoading } = useQuery({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const response = await fetch('/api/price-lists')
      if (!response.ok) throw new Error('Error al cargar listas')
      const data = await response.json()
      return data.pricelists as PriceList[]
    },
  })


  // Create mutation - ahora crea en Dashboard Y Odoo
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/price-lists', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          discountPercent: data.discountPercentage,
          type: data.type
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear lista')
      }

      return response.json()
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['price-lists'] })
        resetForm()
      } else {
        toast.error(result.error || 'Error desconocido')
      }
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { priceListId: string } & typeof formData) => {
      const { updatePriceList } = await import('@/app/actions/products')
      return updatePriceList(data)
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['price-lists'] })
        resetForm()
      } else {
        toast.error(result.error)
      }
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (priceListId: string) => {
      const { deletePriceList } = await import('@/app/actions/products')
      return deletePriceList({ priceListId })
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['price-lists'] })
      } else {
        toast.error(result.error)
      }
    },
  })

  const resetForm = () => {
    setFormData({ name: '', type: 'mayorista', discountPercentage: 0 })
    setIsCreating(false)
    setEditingList(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingList) {
      updateMutation.mutate({ ...formData, priceListId: editingList.id })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (list: PriceList) => {
    setEditingList(list)
    setFormData({
      name: list.name,
      type: list.type as any,
      discountPercentage: list.discount_percentage,
    })
    setIsCreating(true)
  }

  const handleDelete = (list: PriceList) => {
    if (confirm(`¿Eliminar lista "${list.name}"? Esta acción también la archivará en Odoo.`)) {
      deleteMutation.mutate(list.id)
    }
  }

  const typeColors = {
    mayorista: 'bg-blue-100 text-blue-700',
    minorista: 'bg-green-100 text-green-700',
    especial: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-morph-gray-900">
            Listas de Precios
          </h2>
          <p className="mt-1 text-sm text-morph-gray-600">
            Gestiona tarifas especiales para tus clientes
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(!isCreating)}
          variant="primary"
          disabled={createMutation.isPending}
        >
          <Plus className="h-5 w-5" />
          Nueva Lista
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="rounded-lg border-2 border-morph-primary-300 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-morph-gray-900">
            {editingList ? 'Editar Lista' : 'Crear Nueva Lista'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Nombre de la Lista
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Mayoristas Premium"
                required
                className="w-full rounded-lg border border-morph-gray-300 px-4 py-2 focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-lg border border-morph-gray-300 px-4 py-2 focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
                >
                  <option value="mayorista">Mayorista</option>
                  <option value="minorista">Minorista</option>
                  <option value="especial">Especial</option>
                </select>
              </div>

              {/* Descuento global eliminado por solicitud del usuario - se usarán reglas específicas */}
              <div className="hidden">
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-morph-gray-300 px-4 py-2 focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingList ? 'Actualizar' : 'Crear'} Lista
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Price Lists Grid */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-morph-gray-600">Cargando listas...</p>
        </div>
      ) : priceLists && priceLists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {priceLists.map((list) => (
            <div
              key={list.id}
              className="group rounded-lg border border-morph-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-morph-primary-500 to-morph-primary-600 text-white shadow-sm">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-morph-gray-900">
                      {list.name}
                    </h3>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[list.type as keyof typeof typeColors]}`}>
                      {list.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-lg bg-morph-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-morph-primary-600" />
                  <span className="text-2xl font-bold text-morph-gray-900">
                    {list.discount_percentage}%
                  </span>
                  <span className="text-sm text-morph-gray-600">descuento</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedListForRules(list)
                    setRulesModalOpen(true)
                  }}
                  className="flex-1"
                >
                  <List className="h-4 w-4" />
                  Ver Reglas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(list)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(list)}
                  disabled={deleteMutation.isPending}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="mt-3 text-xs text-morph-gray-500">
                Odoo ID: {list.odoo_pricelist_id}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-morph-gray-100">
            <Tag className="h-8 w-8 text-morph-gray-400" />
          </div>
          <p className="text-morph-gray-600">
            No hay listas de precios creadas
          </p>
          <p className="mt-1 text-sm text-morph-gray-500">
            Crea tu primera lista para asignarla a clientes
          </p>
        </div>
      )}

      {/* Rules Modal */}
      {selectedListForRules && (
        <ModalReglasListaPrecios
          isOpen={rulesModalOpen}
          onClose={() => {
            setRulesModalOpen(false)
            setSelectedListForRules(null)
          }}
          priceListId={selectedListForRules.id}
          priceListName={selectedListForRules.name}
          products={products || []}
          onSave={async (rules) => {
            const response = await fetch(`/api/price-lists/${selectedListForRules.id}/rules`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rules })
            })
            if (!response.ok) throw new Error('Error al guardar reglas')
          }}
        />
      )}
    </div>
  )
}
