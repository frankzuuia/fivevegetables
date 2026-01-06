// =====================================================
// COMPONENT: Catálogo Productos (Cliente)
// Grid productos con precios personalizados + carrito
// =====================================================

'use client'

import { useState } from 'react'
import { useProductsCatalog } from '@/lib/hooks/useProducts'
import { useCartStore } from '@/lib/stores/cartStore'
import { Button } from '@/components/ui/Button'
import { ShoppingCart, Plus, Minus, Search } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

export function CatalogoProductos() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: productos, isLoading, error } = useProductsCatalog()
  const { items, addItem, updateQuantity, getTotalItems } = useCartStore()
  
  const productosFiltrados = productos?.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.productId === productId)
    return item?.quantity || 0
  }
  
  const handleAddToCart = (producto: any) => {
    addItem({
      productId: producto.id,
      odooProductId: producto.odoo_product_id,
      name: producto.name,
      price: producto.price,
      quantity: 1,
      imageUrl: producto.image_url,
    })
    toast.success(`${producto.name} agregado al carrito`)
  }
  
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      updateQuantity(productId, 0)
      toast.info('Producto eliminado del carrito')
    } else {
      updateQuantity(productId, newQuantity)
    }
  }
  
  if ((error as any)?.message?.includes('Esperando asignación')) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <span className="text-3xl">⏳</span>
        </div>
        <h2 className="text-xl font-bold text-morph-gray-900">
          Esperando Asignación
        </h2>
        <p className="mt-2 text-morph-gray-600">
          Tu cuenta está siendo revisada por nuestro equipo.
        </p>
        <p className="text-sm text-morph-gray-500">
          En breve se te asignará un vendedor y podrás realizar pedidos.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-morph-gray-900">
            Catálogo de Productos
          </h1>
          <p className="mt-2 text-morph-gray-600">
            Precios especiales para tu negocio
          </p>
        </div>
        
        {/* Carrito Badge */}
        <div className="flex items-center gap-2 rounded-lg bg-morph-primary-50 px-4 py-2">
          <ShoppingCart className="h-5 w-5 text-morph-primary-600" />
          <span className="text-2xl font-bold text-morph-primary-700">
            {getTotalItems()}
          </span>
          <span className="text-sm text-morph-gray-600">items</span>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-morph-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full rounded-lg border border-morph-gray-300 bg-white py-3 pl-12 pr-4 transition-all focus:border-transparent focus:ring-2 focus:ring-morph-primary-500"
        />
      </div>
      
      {/* Grid Productos */}
      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-morph-gray-600">Cargando catálogo...</p>
        </div>
      ) : productosFiltrados && productosFiltrados.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productosFiltrados.map((producto: any) => {
            const inCart = getCartQuantity(producto.id)
            
            return (
              <div
                key={producto.id}
                className="group overflow-hidden rounded-lg border border-morph-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Imagen */}
                <div className="relative aspect-square overflow-hidden bg-morph-gray-100">
                  {producto.image_url ? (
                    <Image
                      src={producto.image_url}
                      alt={producto.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-6xl">🥬</span>
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  {!producto.available && (
                    <div className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      Sin stock
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-morph-gray-900 line-clamp-2">
                    {producto.name}
                  </h3>
                  
                  {producto.description && (
                    <p className="mt-1 text-sm text-morph-gray-600 line-clamp-2">
                      {producto.description}
                    </p>
                  )}
                  
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-morph-primary-700">
                      ${producto.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-morph-gray-500">
                      / {producto.unit}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-xs text-morph-gray-500">
                    Stock: {producto.stock} {producto.unit}
                  </p>
                  
                  {/* Actions */}
                  <div className="mt-4">
                    {inCart > 0 ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(producto.id, inCart - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="flex-1 text-center font-bold text-morph-gray-900">
                          {inCart}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(producto.id, inCart + 1)}
                          disabled={!producto.available || inCart >= producto.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full"
                        onClick={() => handleAddToCart(producto)}
                        disabled={!producto.available}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-morph-gray-100">
            <Search className="h-8 w-8 text-morph-gray-400" />
          </div>
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
