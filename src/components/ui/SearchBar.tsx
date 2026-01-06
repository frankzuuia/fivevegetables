'use client'

import { useState, useEffect, InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn, debounce } from '@/lib/utils'

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch: (query: string) => void
  debounceMs?: number
  showClearButton?: boolean
}

export function SearchBar({
  className,
  onSearch,
  debounceMs = 300,
  showClearButton = true,
  placeholder = 'Buscar...',
  ...props
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  
  // Debounced search
  useEffect(() => {
    const debouncedSearch = debounce((value: string) => {
      onSearch(value)
    }, debounceMs)
    
    debouncedSearch(query)
  }, [query, onSearch, debounceMs])
  
  const handleClear = () => {
    setQuery('')
    onSearch('')
  }
  
  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-morph-gray-500" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-morph-lg bg-morph-surface py-3 pl-12 pr-12 font-medium text-morph-gray-900 shadow-morph-inset outline-none transition-all placeholder:text-morph-gray-500',
          'focus:shadow-morph-inset-deep focus:ring-2 focus:ring-morph-primary-500 focus:ring-opacity-20'
        )}
        {...props}
      />
      {showClearButton && query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-morph-gray-500 hover:text-morph-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
