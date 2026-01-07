'use client'

import { Modal } from '@/components/ui/Modal'
import { Calendar, X } from 'lucide-react'
import { useState } from 'react'

interface ModalSelectorMesProps {
  isOpen: boolean
  onClose: () => void
  onSelectMonth: (month: number, year: number) => void
  currentMonth?: { month: number; year: number } | null
}

export function ModalSelectorMes({ isOpen, onClose, onSelectMonth, currentMonth }: ModalSelectorMesProps) {
  const today = new Date()
  const currentMonthIndex = today.getMonth()
  const currentYearValue = today.getFullYear()
  
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number }>(
    currentMonth || { month: currentMonthIndex, year: currentYearValue }
  )
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  
  // Generate last 24 months (going backwards from current month)
  const generateMonthOptions = () => {
    const options: { month: number; year: number; label: string; isCurrent: boolean; isFuture: boolean }[] = []
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentYearValue, currentMonthIndex - i, 1)
      const month = date.getMonth()
      const year = date.getFullYear()
      const isCurrent = month === currentMonthIndex && year === currentYearValue
      
      options.push({
        month,
        year,
        label: `${monthNames[month]} ${year}`,
        isCurrent,
        isFuture: false
      })
    }
    
    return options
  }
  
  const monthOptions = generateMonthOptions()
  
  const handleMonthClick = (month: number, year: number) => {
    setSelectedMonth({ month, year })
  }
  
  const handleConfirm = () => {
    onSelectMonth(selectedMonth.month, selectedMonth.year)
    onClose()
  }
  
  const isSelected = (month: number, year: number) => {
    return selectedMonth.month === month && selectedMonth.year === year
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-morph-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Seleccionar Mes Específico
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-morph-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Month Display */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-purple-700">
            <span className="font-medium">Mes seleccionado:</span>{' '}
            {monthNames[selectedMonth.month]} {selectedMonth.year}
          </p>
        </div>

        {/* Month List (Scrollable) */}
        <div className="flex-1 overflow-y-auto mb-6 border border-morph-gray-200 rounded-lg">
          <div className="divide-y divide-morph-gray-200">
            {monthOptions.map((option) => (
              <button
                key={`${option.year}-${option.month}`}
                onClick={() => handleMonthClick(option.month, option.year)}
                className={`w-full p-4 text-left transition-all ${
                  isSelected(option.month, option.year)
                    ? 'bg-purple-600 text-white'
                    : option.isCurrent
                    ? 'bg-purple-50 hover:bg-purple-100'
                    : 'hover:bg-morph-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${
                      isSelected(option.month, option.year) ? 'text-white' : 'text-morph-gray-900'
                    }`}>
                      {option.label}
                    </p>
                    {option.isCurrent && !isSelected(option.month, option.year) && (
                      <p className="text-xs text-purple-600 font-medium mt-1">Mes Actual</p>
                    )}
                  </div>
                  {isSelected(option.month, option.year) && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white border border-morph-gray-300 text-morph-gray-700 font-medium hover:bg-morph-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 shadow-sm"
          >
            Aplicar Filtro
          </button>
        </div>
      </div>
    </Modal>
  )
}
