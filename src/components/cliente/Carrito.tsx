// =====================================================
// COMPONENT: Carrito
// Drawer/modal carrito compras (Dashboard Cliente)
// =====================================================

'use client'

import { useCart } from '@/lib/hooks/useCart'
import { X, Plus, Minus, ShoppingCart, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Carrito() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, total, isEmpty } = useCart()
  
  const handleConfirmarPedido = () => {
    if (isEmpty) return
    
    // Navigate to checkout (will trigger ModalDatosEntrega/Fiscales)
    router.push('/dashboard/cliente/checkout')
  }
  
  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-200 p-3">
            <ShoppingCart className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              🛒 Mi Carrito
            </h2>
            <p className="text-sm text-morph-gray-600">
              {items.length} producto(s)
            </p>
          </div>
        </div>
      </div>
      
      {/* Empty State */}
      {isEmpty ? (
        <div className="rounded-lg border border-morph-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto h-16 w-16 text-morph-gray-300" />
          <p className="mt-4 text-morph-gray-600">
            Tu carrito está vacío
          </p>
          <p className="mt-2 text-sm text-morph-gray-500">
            Agrega productos desde el catálogo
          </p>
        </div>
      ) : (
        <>
          {/* Items List */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="overflow-hidden rounded-lg border border-morph-gray-200 bg-white shadow-sm"
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                      <Package className="h-8 w-8 text-green-300" />
                    </div>
                  )}
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-morph-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-morph-gray-600">
                          ${item.price.toFixed(2)} / {item.unit}
                        </p>
                      </div>
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                        title="Eliminar"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Quantity Stepper + Subtotal */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-morph-gray-300 bg-white transition-colors hover:bg-morph-gray-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <span className="w-12 text-center font-bold text-morph-gray-900">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-600 bg-green-600 text-white transition-colors hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-morph-gray-600">Subtotal</p>
                        <p className="text-xl font-bold text-green-700">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Divider */}
          <div className="border-t-2 border-dashed border-morph-gray-300" />
          
          {/* Total */}
          <div className="rounded-lg border-2 border-green-600 bg-gradient-to-br from-green-50 to-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morph-gray-600">Total del Pedido</p>
                <p className="text-3xl font-bold text-green-700">
                  ${total.toFixed(2)}
                </p>
              </div>
              
              <div className="text-right text-sm text-morph-gray-600">
                <p>{items.length} productos</p>
                <p>{items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
              </div>
            </div>
          </div>
          
          {/* Confirmar Pedido Button */}
          <button
            onClick={handleConfirmarPedido}
            className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-lg font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            ✅ Confirmar Pedido
          </button>
        </>
      )}
    </div>
  )
}
