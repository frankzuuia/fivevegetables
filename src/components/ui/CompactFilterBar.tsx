'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuickFilter = 'hoy' | 'ayer' | 'semana' | 'mes' | 'año'

interface CompactFilterBarProps {
  value: QuickFilter
  onChange: (filter: QuickFilter) => void
  className?: string
}

const filterLabels: Record<QuickFilter, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: 'Esta Semana',
  mes: 'Mes',
  año: 'Año',
}

export function CompactFilterBar({ value, onChange, className }: CompactFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (option: QuickFilter) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-morph-gray-900 shadow-sm border border-morph-gray-300 transition-all hover:border-morph-primary-400 hover:shadow-md',
          isOpen && 'border-morph-primary-500 shadow-md'
        )}
      >
        <span className="text-xs text-morph-gray-600">Período:</span>
        <span className="text-morph-primary-600">{filterLabels[value]}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-morph-gray-600 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full left-0 right-0 z-10 mt-1 w-40 animate-slide-down rounded-lg bg-white shadow-lg border border-morph-gray-200">
            <div className="p-1.5 space-y-0.5">
              {(Object.keys(filterLabels) as QuickFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full rounded px-3 py-2 text-left text-sm font-medium transition-all',
                    value === option
                      ? 'bg-morph-primary-100 text-morph-primary-700'
                      : 'text-morph-gray-700 hover:bg-morph-surface'
                  )}
                >
                  {filterLabels[option]}
                </button>
              ))}
            </div>
          </div>
          <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  )
}
