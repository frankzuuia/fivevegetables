import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ProductCache } from '@/types/database'

export interface CartItem {
  product: ProductCache
  quantity: number
  unitPrice: number
}

interface CartState {
  items: CartItem[]
  isHydrated: boolean
}

interface CartActions {
  addItem: (product: ProductCache, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  setHydrated: (hydrated: boolean) => void
}

type CartStore = CartState & CartActions

const initialState: CartState = {
  items: [],
  isHydrated: false,
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addItem: (product, quantity) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id)
        
        if (existingItem) {
          // Actualizar cantidad (máximo 99)
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: Math.min(item.quantity + quantity, 99) }
                : item
            ),
          })
        } else {
          // Agregar nuevo item
          set({
            items: [
              ...items,
              {
                product,
                quantity: Math.min(quantity, 99),
                unitPrice: product.base_price,
              },
            ],
          })
        }
      },
      
      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        })
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        
        set({
          items: get().items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.min(quantity, 99) }
              : item
          ),
        })
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.unitPrice * item.quantity,
          0
        )
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'five-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        // NO persistir isHydrated
      }),
    }
  )
)
