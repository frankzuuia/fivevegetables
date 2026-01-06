'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FilterOption = 'hoy' | 'ayer' | 'semana' | 'mes' | 'año'

export interface FilterAccordionProps {
  onFilterChange: (filter: FilterOption) => void
  defaultFilter?: FilterOption
  className?: string
}

const filterLabels: Record<FilterOption, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: 'Esta Semana',
  mes: 'Este Mes',
  año: 'Todo el Año',
}

export function FilterAccordion({
  onFilterChange,
  defaultFilter = 'hoy',
  className,
}: FilterAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<FilterOption>(defaultFilter)
  
  const handleSelect = (option: FilterOption) => {
    setSelected(option)
    onFilterChange(option)
    setIsOpen(false)
  }
  
  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      {/* Accordion Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-morph-lg bg-white px-6 py-3 font-heading font-medium text-morph-gray-900 shadow-morph transition-all hover:shadow-morph-lg',
          isOpen && 'shadow-morph-lg'
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm text-morph-gray-600">Filtrar:</span>
          <span className="text-morph-primary-600">{filterLabels[selected]}</span>
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-morph-gray-600 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      
      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-2 animate-slide-down rounded-morph-lg bg-white shadow-morph-lg">
          <div className="p-2 space-y-1">
            {(Object.keys(filterLabels) as FilterOption[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full rounded-morph px-4 py-3 text-left font-medium transition-all',
                  selected === option
                    ? 'bg-morph-primary-100 text-morph-primary-700'
                    : 'text-morph-gray-700 hover:bg-morph-surface'
                )}
              >
                {filterLabels[option]}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Backdrop (click outside to close) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
