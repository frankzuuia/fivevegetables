import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-heading font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-gradient-to-r from-morph-primary-500 to-morph-primary-600 text-white shadow-morph hover:scale-105 hover:shadow-morph-lg active:scale-100',
      secondary: 'bg-morph-gray-200 text-morph-gray-900 shadow-morph hover:bg-morph-gray-300 hover:shadow-morph-lg',
      outline: 'border-2 border-morph-primary-500 bg-white text-morph-primary-600 shadow-morph hover:bg-morph-primary-50 hover:shadow-morph-lg',
      ghost: 'bg-transparent text-morph-gray-700 hover:bg-morph-gray-100',
    }
    
    const sizes = {
      sm: 'rounded-morph px-4 py-2 text-sm',
      md: 'rounded-morph-lg px-6 py-3 text-base',
      lg: 'rounded-morph-lg px-8 py-4 text-lg',
    }
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando...
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
