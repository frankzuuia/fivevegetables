// =====================================================
// COMPONENT: Gestión de Productos (Gerente)
// Lista de productos con stock y edición de precios
// =====================================================

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Search, Edit2, Package, Check, X, Power } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  display_name: string
  image_url: string
  list_price: number
  qty_available: number // Stock from Odoo (synced)
  odoo_product_id: number
  uom: string
}

export function GestionProductos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  const [editUomId, setEditUomId] = useState<number | undefined>(undefined) // Store Odoo UoM ID

  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-manager'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_cache')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Product[]
    },
  })

  // Fetch UoMs from Odoo
  const { data: uomsData } = useQuery({
    queryKey: ['uoms'],
    queryFn: async () => {
      const response = await fetch('/api/uoms')
      if (!response.ok) throw new Error('Error al cargar unidades')
      return response.json()
    },
  })

  const uoms = uomsData?.uoms || []

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ productId, odooProductId, newPrice, uomId }: {
      productId: string
      odooProductId: number
      newPrice: number
      uomId?: number
    }) => {
      console.log('[GestionProductos] Updating:', { productId, odooProductId, newPrice, uomId })
      const { updateProductPrice } = await import('@/app/actions/products')
      return updateProductPrice({ productId, odooProductId, newPrice, uomId })
    },
    onSuccess: (result) => {
      console.log('[GestionProductos] Update result:', result)
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['products-manager'] })
        setEditingId(null)
      } else {
        toast.error(result.error)
      }
    },
    onError: (error) => {
      console.error('[GestionProductos] Update error:', error)
      toast.error('Error al actualizar')
    }
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ productId, odooProductId, active }: {
      productId: string
      odooProductId: number
      active: boolean
    }) => {
      const { toggleProductActive } = await import('@/app/actions/products')
      return toggleProductActive({ productId, odooProductId, active })
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['products-manager'] })
      } else {
        toast.error(result.error)
      }
    },
    onError: (error) => {
      console.error('[GestionProductos] Toggle error:', error)
      toast.error('Error al cambiar estado')
    }
  })

  // Filter products
  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditClick = (product: Product) => {
    setEditingId(product.id)
    setEditPrice(product.list_price.toString())
    // Find matching UoM ID from Odoo based on current product.uom
    const matchingUom = uoms.find((u: any) => u.name.toLowerCase() === product.uom?.toLowerCase())
    setEditUomId(matchingUom?.id)
  }

  const handleSavePrice = (product: Product) => {
    const newPrice = parseFloat(editPrice)
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    updatePriceMutation.mutate({
      productId: product.id,
      odooProductId: product.odoo_product_id,
      newPrice,
      uomId: editUomId // Send UoM ID if changed
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-morph-gray-900">
            Catálogo de Productos
          </h2>
          <p className="mt-1 text-sm text-morph-gray-600">
            Gestiona precios base y consulta stock
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-morph-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full rounded-lg border border-morph-gray-300 bg-white py-3 pl-12 pr-4 transition-all focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
        />
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-morph-gray-600">Cargando catálogo...</p>
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`group relative overflow-hidden rounded-xl border border-morph-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md ${!product.active ? 'opacity-50 grayscale' : ''
                }`}
            >
              {/* Image & Stock Badge */}
              <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-morph-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-morph-gray-400">
                    <Package className="h-12 w-12" />
                  </div>
                )}

                {/* Toggle Active Button */}
                <button
                  onClick={() => toggleActiveMutation.mutate({
                    productId: product.id,
                    odooProductId: product.odoo_product_id,
                    active: !product.active
                  })}
                  disabled={toggleActiveMutation.isPending}
                  className={`absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all ${product.active
                      ? 'bg-green-500/90 hover:bg-green-600 text-white'
                      : 'bg-gray-400/90 hover:bg-gray-500 text-white'
                    }`}
                  title={product.active ? 'Desactivar producto' : 'Activar producto'}
                >
                  <Power className="h-4 w-4" />
                </button>

                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
                  <div className={`h-2 w-2 rounded-full ${product.qty_available > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-morph-gray-700">
                    {product.qty_available} {product.uom || 'unid'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <h3 className="mb-1 font-semibold text-morph-gray-900 line-clamp-2 min-h-[3rem]">
                {product.display_name || product.name}
              </h3>

              {/* Price Editor */}
              <div className="mt-3 border-t border-morph-gray-100 pt-3">
                {editingId === product.id ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-20 rounded border border-morph-primary-300 px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-morph-primary-500"
                        autoFocus
                      />
                      <select
                        value={editUomId || ''}
                        onChange={(e) => setEditUomId(Number(e.target.value))}
                        className="rounded border border-morph-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-morph-primary-500"
                      >
                        {uoms.map((uom: any) => (
                          <option key={uom.id} value={uom.id}>
                            {uom.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSavePrice(product)}
                        disabled={updatePriceMutation.isPending}
                        className="flex-1 rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        {updatePriceMutation.isPending ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={updatePriceMutation.isPending}
                        className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-morph-gray-500">Precio Base</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-morph-primary-600">
                          ${product.list_price?.toFixed(2)}
                        </span>
                        <span className="text-xs text-morph-gray-500">
                          / {product.uom || 'kg'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(product)}
                      className="h-8 w-8 p-0 text-morph-gray-400 hover:text-morph-primary-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-morph-gray-600">
            {searchTerm
              ? `No se encontraron productos con "${searchTerm}"`
              : 'No hay productos disponibles'}
          </p>
        </div>
      )}
    </div>
  )
}
