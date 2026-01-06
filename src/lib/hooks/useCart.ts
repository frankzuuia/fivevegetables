// =====================================================
// HOOK: useCart
// State management carrito compras con localStorage persist
// Dashboard Cliente
// =====================================================

'use client'

import { useState, useEffect } from 'react'

export interface CarritoItem {
  productId: string
  odooProductId: number
  name: string
  price: number // personalizado
  quantity: number
  subtotal: number
  imageUrl?: string | null
  unit: string
  category?: string | null
}

export function useCart() {
  const [items, setItems] = useState<CarritoItem[]>([])
  const [isClient, setIsClient] = useState(false)
  
  // Hydration safety
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('five_cart')
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch (error) {
        console.error('[useCart] Error parsing localStorage:', error)
        localStorage.removeItem('five_cart')
      }
    }
  }, [])
  
  // Persist to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('five_cart', JSON.stringify(items))
    }
  }, [items, isClient])
  
  const addItem = (product: Omit<CarritoItem, 'subtotal'>, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId)
      
      if (existing) {
        // Update quantity
        return prev.map((i) =>
          i.productId === product.productId
            ? {
                ...i,
                quantity: i.quantity + quantity,
                subtotal: (i.quantity + quantity) * i.price,
              }
            : i
        )
      }
      
      // Add new item
      return [
        ...prev,
        {
          ...product,
          quantity,
          subtotal: product.price * quantity,
        },
      ]
    })
  }
  
  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }
  
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
      return
    }
    
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              quantity: newQuantity,
              subtotal: newQuantity * i.price,
            }
          : i
      )
    )
  }
  
  const clearCart = () => {
    setItems([])
  }
  
  const total = items.reduce((sum, i) => sum + i.subtotal, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  
  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    isEmpty: items.length === 0,
  }
}
