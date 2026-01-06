// =====================================================
// DATE RANGE UTILITIES
// Helper para calcular rangos de fechas según filtro
// =====================================================

export type FilterOption = 'today' | 'yesterday' | 'week' | 'month' | 'year'

export function getDateRange(filter: FilterOption): {
  startDate: string
  endDate: string
} {
  const now = new Date()
  const endDate = now.toISOString()
  let startDate: Date

  switch (filter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break

    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return {
        startDate: startDate.toISOString(),
        endDate: yesterdayEnd.toISOString(),
      }

    case 'week':
      // Últimos 7 días
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break

    case 'month':
      // Últimos 30 días
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break

    case 'year':
      // Últimos 365 días
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break

    default:
      // Default: hoy
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  return {
    startDate: startDate.toISOString(),
    endDate,
  }
}

// =====================================================
// CURRENCY FORMATTER
// =====================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

// =====================================================
// NUMBER FORMATTER (para porcentajes, cantidades)
// =====================================================

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}
