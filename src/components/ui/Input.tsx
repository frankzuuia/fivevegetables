import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-morph-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-morph bg-morph-surface px-4 py-3 font-medium text-morph-gray-900 shadow-morph-inset outline-none transition-all placeholder:text-morph-gray-500',
            'focus:shadow-morph-inset-deep focus:ring-2 focus:ring-morph-primary-500 focus:ring-opacity-20',
            error && 'ring-2 ring-morph-error ring-opacity-50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-morph-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-morph-gray-600">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
