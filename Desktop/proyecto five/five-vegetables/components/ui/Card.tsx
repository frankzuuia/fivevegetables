import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outlined'
  clickable?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', clickable, children, ...props }, ref) => {
    const baseStyles = 'rounded-morph-xl p-6 transition-all'
    
    const variants = {
      elevated: 'bg-white shadow-morph hover:shadow-morph-lg',
      flat: 'bg-morph-surface',
      outlined: 'bg-white border-2 border-morph-border',
    }
    
    const clickableStyles = clickable ? 'cursor-pointer hover:scale-[1.02] active:scale-100' : ''
    
    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], clickableStyles, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-heading text-xl font-bold text-morph-gray-900', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-morph-gray-700', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardContent }
