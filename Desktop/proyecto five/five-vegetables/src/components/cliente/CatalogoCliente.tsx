// =====================================================
// COMPONENT: Catálogo Cliente
// Productos con precios personalizados según tarifa (Dashboard Cliente)
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getPersonalizedCatalog, PersonalizedProduct } from '@/app/actions/prices'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterAccordion, type FilterOption } from '@/components/ui/FilterAccordion'
import { useCart } from '@/lib/hooks/useCart'
import { ShoppingCart, Package, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function CatalogoCliente() {
  const supabase = createClient()
  const { addItem } = useCart()
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [addingProduct, setAddingProduct] = useState<string | null>(null)
  
  useEffect(() => {
    fetchClienteId()
  }, [])
  
  const fetchClienteId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: cliente } = await supabase
        .from('clients_mirror')
        .select('id')
        .eq('profile_id', user.id)
        .single()
      
      if (cliente) setClienteId((cliente as any).id)
    } catch (error) {
      console.error('[CatalogoCliente fetchClienteId]', error)
    }
  }
  
  const { data: productos, isLoading, error } = useQuery({
    queryKey: ['productos', 'personalizados', clienteId, category, searchQuery],
    queryFn: async (): Promise<PersonalizedProduct[]> => {
      if (!clienteId) return []
      
      const result = await getPersonalizedCatalog({
        clienteId,
        category: category || undefined,
        search: searchQuery || undefined,
      })
      
      return result
    },
    enabled: !!clienteId,
    staleTime: 30 * 1000, // 30s
  })
  
  // Get unique categories for filter
  const categories = Array.from(
    new Set(productos?.map((p) => p.category).filter(Boolean))
  ) as string[]
  
  const handleAddToCart = async (producto: PersonalizedProduct) => {
    setAddingProduct(producto.id)
    
    try {
      addItem(
        {
          productId: producto.id,
          odooProductId: producto.odooProductId,
          name: producto.name,
          price: producto.personalizedPrice,
          quantity: 1,
          imageUrl: producto.imageUrl,
          unit: producto.unitOfMeasure,
          category: producto.category,
        },
        1
      )
      
      toast.success(`✅ ${producto.name} agregado al carrito`)
      
      // Success animation
      setTimeout(() => setAddingProduct(null), 500)
    } catch (error) {
      console.error('[Add to cart error]', error)
      toast.error('Error al agregar producto')
      setAddingProduct(null)
    }
  }
  
  if (!clienteId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-16 w-16 text-morph-gray-300" />
          <p className="mt-4 text-morph-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
        <h2 className="text-2xl font-bold text-morph-gray-900">
          🛒 Catálogo de Productos
        </h2>
        <p className="mt-1 text-sm text-morph-gray-600">
          Precios personalizados para ti
        </p>
      </div>
      
      {/* SearchBar */}
      <SearchBar
        value={searchQuery}
        onSearch={setSearchQuery}
        placeholder="Buscar productos..."
      />
      
      {/* Filter Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === ''
                ? 'bg-green-600 text-white'
                : 'bg-white text-morph-gray-700 border border-morph-gray-300 hover:bg-morph-gray-50'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-morph-gray-700 border border-morph-gray-300 hover:bg-morph-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      
      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-morph-gray-200 bg-white p-4">
              <div className="aspect-video w-full rounded-lg bg-morph-gray-200" />
              <div className="mt-4 h-6 w-3/4 rounded bg-morph-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-morph-gray-100" />
            </div>
          ))}
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <p className="mt-2 text-red-900">Error al cargar productos</p>
        </div>
      )}
      
      {/* Products Grid */}
      {!isLoading && !error && productos && productos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="overflow-hidden rounded-lg border border-morph-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Image */}
              {producto.imageUrl ? (
                <img
                  src={producto.imageUrl}
                  alt={producto.name}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="aspect-video w-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <Package className="h-16 w-16 text-green-300" />
                </div>
              )}
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-morph-gray-900 line-clamp-2">
                  {producto.name}
                </h3>
                
                {producto.description && (
                  <p className="mt-1 text-sm text-morph-gray-600 line-clamp-2">
                    {producto.description}
                  </p>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      ${producto.personalizedPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-morph-gray-500">
                      por {producto.unitOfMeasure}
                    </p>
                  </div>
                  
                  {/* Stock indicator */}
                  {producto.stockQuantity > 0 ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Stock: {producto.stockQuantity}
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      Sin stock
                    </span>
                  )}
                </div>
                
                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(producto)}
                  disabled={producto.stockQuantity <= 0 || addingProduct === producto.id}
                  className={`mt-4 w-full rounded-lg px-4 py-3 font-medium text-white transition-all ${
                    addingProduct === producto.id
                      ? 'bg-green-500 scale-95'
                      : producto.stockQuantity > 0
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-md'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {addingProduct === producto.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      ¡Agregado!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Agregar al carrito
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && !error && (
          <div className="rounded-lg border border-morph-gray-200 bg-white p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-morph-gray-300" />
            <p className="mt-4 text-morph-gray-600">
              {searchQuery || category
                ? 'No se encontraron productos'
                : 'No hay productos disponibles'}
            </p>
          </div>
        )
      )}
    </div>
  )
}
