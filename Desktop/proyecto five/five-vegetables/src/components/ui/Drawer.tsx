'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  position?: 'left' | 'right' | 'bottom'
  className?: string
}

export function Drawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'right',
  className,
}: DrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  const positionStyles = {
    left: 'left-0 top-0 h-full w-full max-w-md translate-x-0 sm:translate-x-0',
    right: 'right-0 top-0 h-full w-full max-w-md translate-x-0 sm:translate-x-0',
    bottom: 'bottom-0 left-0 w-full max-h-[85vh] translate-y-0',
  }
  
  const slideAnimation = {
    left: isOpen ? 'animate-slide-in-left' : '',
    right: isOpen ? 'animate-slide-in-right' : '',
    bottom: isOpen ? 'animate-slide-in-bottom' : '',
  }
  
  return (
    <>
      {/* Backdrop with blur */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed z-50 bg-white shadow-morph-lg',
          positionStyles[position],
          slideAnimation[position],
          position === 'bottom' && 'rounded-t-morph-xl',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-morph-border p-6">
          {title && (
            <h2 id="drawer-title" className="font-heading text-2xl font-bold text-morph-gray-900">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-morph-surface text-morph-gray-600 transition-all hover:bg-morph-gray-200 hover:text-morph-gray-900 active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content with custom scrollbar */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {children}
        </div>
      </div>
    </>
  )
}
