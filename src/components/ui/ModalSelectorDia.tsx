'use client'

import { Modal } from '@/components/ui/Modal'
import { Calendar, X } from 'lucide-react'
import { useState } from 'react'

interface ModalSelectorDiaProps {
  isOpen: boolean
  onClose: () => void
  onSelectDay: (day: Date) => void
  currentDay?: Date | null
}

export function ModalSelectorDia({ isOpen, onClose, onSelectDay, currentDay }: ModalSelectorDiaProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDay || new Date())
  
  const today = new Date()
  const currentMonth = selectedDate.getMonth()
  const currentYear = selectedDate.getFullYear()
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  
  // Month/Year navigation
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, 1))
  }
  
  const goToNextMonth = () => {
    // Don't allow future months
    if (currentYear < today.getFullYear() || 
        (currentYear === today.getFullYear() && currentMonth < today.getMonth())) {
      setSelectedDate(new Date(currentYear, currentMonth + 1, 1))
    }
  }
  
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day, 0, 0, 0, 0)
    // Don't allow future dates
    if (clickedDate <= today) {
      setSelectedDate(clickedDate)
    }
  }
  
  const handleConfirm = () => {
    onSelectDay(selectedDate)
    onClose()
  }
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  // Build calendar grid
  const calendarDays = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10" />)
  }
  
  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(currentYear, currentMonth, day)
    const isToday = dayDate.toDateString() === today.toDateString()
    const isSelected = dayDate.toDateString() === selectedDate.toDateString()
    const isFuture = dayDate > today
    
    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        disabled={isFuture}
        className={`h-10 rounded-lg text-sm font-medium transition-all ${
          isSelected
            ? 'bg-blue-600 text-white shadow-sm'
            : isToday
            ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
            : isFuture
            ? 'text-morph-gray-300 cursor-not-allowed'
            : 'hover:bg-morph-gray-100 text-morph-gray-700'
        }`}
      >
        {day}
      </button>
    )
  }
  
  const canGoNext = currentYear < today.getFullYear() || 
                    (currentYear === today.getFullYear() && currentMonth < today.getMonth())

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-morph-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Seleccionar Día Específico
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-morph-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Month/Year Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 rounded-lg bg-white border border-morph-gray-300 hover:bg-morph-gray-50 text-morph-gray-700 font-medium"
          >
            ← Anterior
          </button>
          <span className="text-lg font-bold text-morph-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className={`px-4 py-2 rounded-lg font-medium ${
              canGoNext
                ? 'bg-white border border-morph-gray-300 hover:bg-morph-gray-50 text-morph-gray-700'
                : 'bg-morph-gray-100 text-morph-gray-400 cursor-not-allowed'
            }`}
          >
            Siguiente →
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(name => (
            <div key={name} className="text-center text-xs font-semibold text-morph-gray-600">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {calendarDays}
        </div>

        {/* Selected Date Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Fecha seleccionada:</span>{' '}
            {selectedDate.toLocaleDateString('es-MX', { 
              weekday: 'long',
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
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
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm"
          >
            Aplicar Filtro
          </button>
        </div>
      </div>
    </Modal>
  )
}
