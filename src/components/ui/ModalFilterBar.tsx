'use client'

import { useState } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuickFilter = 'hoy' | 'ayer' | 'semana' | 'mes' | 'año'

export interface ModalFilterState {
  activeType: 'quick' | 'specificDay'
  quickFilter: QuickFilter | null
  specificDay: Date | null
}

interface ModalFilterBarProps {
  filterState: ModalFilterState
  onFilterChange: (state: ModalFilterState) => void
  onOpenDayModal: () => void
  className?: string
}

const filterLabels: Record<QuickFilter, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: 'Esta Semana',
  mes: 'Mes',
  año: 'Año',
}

export function ModalFilterBar({ filterState, onFilterChange, onOpenDayModal, className }: ModalFilterBarProps) {
  const [periodOpen, setPeriodOpen] = useState(false)

  const handleQuickFilterClick = (filter: QuickFilter) => {
    onFilterChange({
      ...filterState,
      activeType: 'quick',
      quickFilter: filter,
    })
    setPeriodOpen(false)
  }

  const getDayButtonText = () => {
    if (!filterState.specificDay) return 'Día Específico'
    const day = filterState.specificDay.getDate()
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const month = monthNames[filterState.specificDay.getMonth()]
    return `${day} ${month}`
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* Quick Filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPeriodOpen(!periodOpen)}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm border transition-all',
            periodOpen || filterState.activeType === 'quick'
              ? 'border-morph-primary-500 shadow-md'
              : 'border-morph-gray-300 hover:border-morph-primary-400'
          )}
        >
          <span className="text-xs text-morph-gray-600">Período:</span>
          <span className="text-morph-primary-600">
            {filterState.activeType === 'quick' && filterState.quickFilter
              ? filterLabels[filterState.quickFilter]
              : 'Hoy'}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-morph-gray-600 transition-transform duration-200',
              periodOpen && 'rotate-180'
            )}
          />
        </button>

        {periodOpen && (
          <>
            <div className="absolute top-full left-0 right-0 z-10 mt-1 w-40 animate-slide-down rounded-lg bg-white shadow-lg border border-morph-gray-200">
              <div className="p-1.5 space-y-0.5">
                {(Object.keys(filterLabels) as QuickFilter[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleQuickFilterClick(option)}
                    className={cn(
                      'w-full rounded px-3 py-2 text-left text-sm font-medium transition-all',
                      filterState.activeType === 'quick' && filterState.quickFilter === option
                        ? 'bg-morph-primary-100 text-morph-primary-700'
                        : 'text-morph-gray-700 hover:bg-morph-surface'
                    )}
                  >
                    {filterLabels[option]}
                  </button>
                ))}
              </div>
            </div>
            <div className="fixed inset-0 z-0" onClick={() => setPeriodOpen(false)} />
          </>
        )}
      </div>

      {/* Day Selector Button */}
      <button
        type="button"
        onClick={onOpenDayModal}
        className={cn(
          'flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm border transition-all',
          filterState.activeType === 'specificDay'
            ? 'border-blue-500 shadow-md'
            : 'border-morph-gray-300 hover:border-blue-400'
        )}
      >
        <Calendar className="h-4 w-4 text-blue-600" />
        <span
          className={cn(
            'text-sm',
            filterState.activeType === 'specificDay' ? 'text-blue-700' : 'text-morph-gray-600'
          )}
        >
          {filterState.specificDay ? getDayButtonText() : 'Día Específico'}
        </span>
        <ChevronDown className="h-4 w-4 text-morph-gray-600" />
      </button>
    </div>
  )
}
