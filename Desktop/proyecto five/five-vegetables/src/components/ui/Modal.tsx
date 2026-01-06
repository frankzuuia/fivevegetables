'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className,
}: ModalProps) {
  // Lock body scroll when modal is open
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
  
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur and fade-in */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Panel with scale-in animation */}
      <div
        className={cn(
          'relative w-full animate-scale-in rounded-morph-xl bg-white shadow-morph-lg',
          sizeStyles[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header with glassmorphism effect */}
        {title && (
          <div className="flex items-center justify-between border-b border-morph-border bg-morph-surface/50 p-6 backdrop-blur-sm">
            <h2 id="modal-title" className="font-heading text-2xl font-bold text-morph-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-morph-gray-600 shadow-morph transition-all hover:bg-morph-gray-200 hover:text-morph-gray-900 hover:shadow-morph-lg active:scale-95"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Content with custom scrollbar */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 120px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* Modal Footer Component */
export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-4 border-t border-morph-border bg-morph-surface/50 p-6',
        className
      )}
    >
      {children}
    </div>
  )
}
