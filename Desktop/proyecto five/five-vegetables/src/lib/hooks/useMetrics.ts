import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { FilterOption } from '@/components/ui/FilterAccordion'

// Types para métricas
export interface GerenteMetrics {
  topClients: Array<{
    id: string
    name: string
    email: string | null
    totalSpent: number
    orderCount: number
  }>
  topVendedores: Array<{
    id: string
    name: string
    salesTotal: number
    orderCount: number
  }>
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
}

export interface VendedorMetrics {
  mySales: number
  myOrders: number
  myClientCount: number
  topClient: {
    id: string
    name: string
    totalSpent: number
  } | null
  trend: {
    value: number
    isPositive: boolean
  }
}

// Hook para métricas Gerente
export function useGerenteMetrics(
  storeId: string,
  filter: FilterOption
): UseQueryResult<GerenteMetrics, Error> {
  return useQuery({
    queryKey: ['metrics', 'gerente', storeId, filter] as const,
    queryFn: async (): Promise<GerenteMetrics> => {
      const res = await fetch(`/api/metrics/gerente?store_id=${storeId}&filter=${filter}`)
      if (!res.ok) throw new Error('Error fetching gerente metrics')
      return res.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!storeId,
  })
}

// Hook para métricas Vendedor (RLS automático)
export function useVendedorMetrics(
  filter: FilterOption
): UseQueryResult<VendedorMetrics, Error> {
  return useQuery({
    queryKey: ['metrics', 'vendedor', filter] as const,
    queryFn: async (): Promise<VendedorMetrics> => {
      // RLS automático: el backend solo retorna métricas del vendedor autenticado
      const res = await fetch(`/api/metrics/vendedor?filter=${filter}`)
      if (!res.ok) throw new Error('Error fetching vendedor metrics')
      return res.json()
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Hook para drill-down en métrica específica
export function useMetricDrillDown(
  metricType: string,
  filter: FilterOption
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: ['metric', 'drilldown', metricType, filter] as const,
    queryFn: async (): Promise<unknown> => {
      const res = await fetch(`/api/metrics/drilldown?type=${metricType}&filter=${filter}`)
      if (!res.ok) throw new Error('Error fetching metric drilldown')
      return res.json()
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!metricType,
  })
}
