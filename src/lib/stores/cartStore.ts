// =====================================================
// ZUSTAND STORE: Shopping Cart
// Estado global carrito cliente
// =====================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  odooProductId: number
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === newItem.productId)
          
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            }
          }
          
          return { items: [...state.items, newItem] }
        }),
      
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity === 0) {
            return {
              items: state.items.filter((i) => i.productId !== productId),
            }
          }
          
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          }
        }),
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
