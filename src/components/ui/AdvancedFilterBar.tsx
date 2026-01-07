'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuickFilter = 'hoy' | 'ayer' | 'semana' | 'mes' | 'año'
export type FilterType = 'quick' | 'specificDay' | 'specificMonth'

export interface DateRange {
  from: Date
  to: Date
}

export interface FilterState {
  activeType: FilterType | null
  quickFilter: QuickFilter | null
  specificDay: Date | null
  specificMonth: { month: number; year: number } | null
  dateRange: DateRange
}

interface AdvancedFilterBarProps {
  filterState: FilterState
  onFilterChange: (newState: FilterState) => void
  onOpenDayModal: () => void
  onOpenMonthModal: () => void
}

const filterLabels: Record<QuickFilter, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: 'Esta Semana',
  mes: 'Mes',
  año: 'Año',
}

export function AdvancedFilterBar({ 
  filterState, 
  onFilterChange,
  onOpenDayModal,
  onOpenMonthModal 
}: AdvancedFilterBarProps) {
  const [periodOpen, setPeriodOpen] = useState(false)

  const handleQuickFilterClick = (filter: QuickFilter) => {
    const now = new Date()
    let from: Date
    let to: Date

    switch (filter) {
      case 'hoy':
        from = new Date(now.setHours(0, 0, 0, 0))
        to = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'ayer':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        from = new Date(yesterday.setHours(0, 0, 0, 0))
        to = new Date(yesterday.setHours(23, 59, 59, 999))
        break
      case 'semana':
        const startOfWeek = new Date(now)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
        startOfWeek.setDate(diff)
        from = new Date(startOfWeek.setHours(0, 0, 0, 0))
        to = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'mes':
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'año':
        from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
        to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
    }

    onFilterChange({
      activeType: 'quick',
      quickFilter: filter,
      specificDay: null,
      specificMonth: null,
      dateRange: { from, to },
    })
    setPeriodOpen(false)
  }

  const getDayButtonText = () => {
    if (filterState.specificDay) {
      return filterState.specificDay.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return 'Seleccionar'
  }

  const getMonthButtonText = () => {
    if (filterState.specificMonth) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      return `${monthNames[filterState.specificMonth.month]} ${filterState.specificMonth.year}`
    }
    return 'Seleccionar'
  }

  return (
    <div className="flex flex-wrap gap-4">
      {/* Accordion 1: Período - SIMPLE como Foto 1 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPeriodOpen(!periodOpen)}
          className={cn(
            'flex items-center gap-2 rounded-morph-lg bg-white px-6 py-3 font-heading font-medium text-morph-gray-900 shadow-morph transition-all hover:shadow-morph-lg',
            periodOpen && 'shadow-morph-lg'
          )}
        >
          <span className="text-sm text-morph-gray-600">Período:</span>
          <span className="text-morph-primary-600">
            {filterState.activeType === 'quick' && filterState.quickFilter 
              ? filterLabels[filterState.quickFilter] 
              : 'Hoy'}
          </span>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-morph-gray-600 transition-transform duration-200',
              periodOpen && 'rotate-180'
            )}
          />
        </button>

        {periodOpen && (
          <>
            <div className="absolute top-full left-0 right-0 z-10 mt-1 animate-slide-down rounded-morph-lg bg-white shadow-morph-lg">
              <div className="p-2 space-y-1">
                {(Object.keys(filterLabels) as QuickFilter[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleQuickFilterClick(option)}
                    className={cn(
                      'w-full rounded-morph px-4 py-3 text-left font-medium transition-all',
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

      {/* Accordion 2: Día Específico - SIMPLE */}
      <div className="relative">
        <button
          type="button"
          onClick={onOpenDayModal}
          className={cn(
            'flex items-center gap-2 rounded-morph-lg bg-white px-6 py-3 font-heading font-medium shadow-morph transition-all hover:shadow-morph-lg',
            filterState.activeType === 'specificDay' && 'shadow-morph-lg'
          )}
        >
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className={cn(
            'text-sm',
            filterState.activeType === 'specificDay' ? 'text-blue-700' : 'text-morph-gray-600'
          )}>
            {filterState.specificDay ? getDayButtonText() : 'Día Específico'}
          </span>
          <ChevronDown className="h-5 w-5 text-morph-gray-600" />
        </button>
      </div>
    </div>
  )
}
