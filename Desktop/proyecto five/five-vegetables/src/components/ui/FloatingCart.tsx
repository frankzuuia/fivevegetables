'use client'

import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export interface FloatingCartProps extends HTMLAttributes<HTMLButtonElement> {
  itemCount: number
  onCartClick: () => void
}

export function FloatingCart({ itemCount, onCartClick, className, ...props }: FloatingCartProps) {
  const hasItems = itemCount > 0
  
  return (
    <button
      type="button"
      onClick={onCartClick}
      className={cn(
        'group fixed bottom-20 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-morph-primary-500 to-morph-primary-600 shadow-morph-lg transition-all hover:scale-110 hover:shadow-morph-lg active:scale-100 md:h-20 md:w-20',
        hasItems && 'animate-pulse-slow',
        className
      )}
      aria-label={`Carrito de compras - ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
      {...props}
    >
      {/* Cart Icon */}
      <div className="relative">
        <ShoppingCart className="h-7 w-7 text-white transition-transform group-hover:scale-110 md:h-8 md:w-8" />
        
        {/* Badge Count with premium animation */}
        {hasItems && (
          <div className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-morph-error shadow-morph animate-scale-in">
            <span className="text-xs font-bold text-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
            {/* Pulse ring animation */}
            <span className="absolute inset-0 animate-ping rounded-full bg-morph-error opacity-75" />
          </div>
        )}
      </div>
      
      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-20 transition-opacity" />
    </button>
  )
}
