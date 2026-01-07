// =====================================================
// HOOKS: Analytics Data Fetching
// React Query hooks for all analytics modals
// =====================================================

import { useQuery } from '@tanstack/react-query'
import type { FilterOption } from '@/components/ui/FilterAccordion'

// ============================================
// Revenue Analytics Hook
// ============================================
export interface RevenueAnalytics {
  revenueTimeline: Array<{
    date: string
    revenue: number
    orderCount: number
  }>
  revenueByVendor: Array<{
    name: string
    revenue: number
    orderCount: number
  }>
  summary: {
    total: number
    orderCount: number
    avgOrderValue: number
    period: { from: string; to: string }
  }
}

export function useRevenueAnalytics(
  storeId: string,
  dateRange: { from: string; to: string }
) {
  return useQuery({
    queryKey: ['analytics', 'revenue', storeId, dateRange],
    queryFn: async (): Promise<RevenueAnalytics> => {
      const params = new URLSearchParams({
        store_id: storeId,
        from: dateRange.from,
        to: dateRange.to
      })
      const res = await fetch(`/api/analytics/revenue?${params}`)
      if (!res.ok) throw new Error('Failed to fetch revenue analytics')
      return res.json()
    },
    enabled: !!storeId && !!dateRange.from && !!dateRange.to,
    staleTime: 60 * 1000 // 1 minute
  })
}

// ============================================
// Orders List Hook
// ============================================
export interface Order {
  id: string
  orderNumber: string
  date: string
  total: number
  subtotal: number
  tax: number
  status: string
  invoiceStatus: string
  requestInvoice: boolean
  notes: string | null
  cliente: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  vendedor: {
    id: string | null
    name: string
  }
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function useOrdersList(
  storeId: string,
  dateRange: { from: string; to: string },
  options: {
    sortBy?: 'date' | 'amount'
    sortOrder?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  } = {}
) {
  const {
    sortBy = 'date',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20
  } = options

  return useQuery({
    queryKey: ['analytics', 'orders', storeId, dateRange, sortBy, sortOrder, page],
    queryFn: async (): Promise<OrdersResponse> => {
      const params = new URLSearchParams({
        store_id: storeId,
        from: dateRange.from,
        to: dateRange.to,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: page.toString(),
        page_size: pageSize.toString()
      })
      const res = await fetch(`/api/analytics/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    },
    enabled: !!storeId && !!dateRange.from && !!dateRange.to,
    staleTime: 30 * 1000
  })
}

// ============================================
// Order Detail Hook
// ============================================
export interface OrderDetail {
  order: {
    id: string
    orderNumber: string
    createdAt: string
    status: string
    invoiceStatus: string
    invoicePdfUrl: string | null
    subtotal: number
    tax: number
    total: number
    requestInvoice: boolean
    notes: string | null
    deliveryInfo: {
      contactName: string | null
      phone: string | null
      restaurant: string | null
      street: string | null
      colonia: string | null
      codigoPostal: string | null
      referencias: string | null
    }
    invoiceInfo: {
      rfc: string | null
      razonSocial: string | null
      codigoPostal: string | null
      generatedAt: string | null
    } | null
  }
  cliente: {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: {
      street: string | null
      numeroExterior: string | null
      colonia: string | null
      codigoPostal: string | null
      ciudad: string | null
      estado: string | null
    }
  }
  vendedor: {
    id: string | null
    name: string
    phone: string | null
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
  }>
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'order-detail', orderId],
    queryFn: async (): Promise<OrderDetail> => {
      const res = await fetch(`/api/analytics/orders/${orderId}`)
      if (!res.ok) throw new Error('Failed to fetch order detail')
      return res.json()
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

// ============================================
// Ticket Promedio Hook
// ============================================
export interface TicketPromedioAnalytics {
  byVendor: Array<{
    vendorId: string
    vendorName: string
    totalSales: number
    orderCount: number
    clientCount: number
    avgTicket: number
  }>
  overall: {
    avgTicket: number
    totalRevenue: number
    totalOrders: number
    period: { from: string; to: string }
  }
  timeline: Array<{
    date: string
    avgTicket: number
    orderCount: number
  }>
}

export function useTicketPromedioAnalytics(
  storeId: string,
  dateRange: { from: string; to: string }
) {
  return useQuery({
    queryKey: ['analytics', 'ticket-promedio', storeId, dateRange],
    queryFn: async (): Promise<TicketPromedioAnalytics> => {
      const params = new URLSearchParams({
        store_id: storeId,
        from: dateRange.from,
        to: dateRange.to
      })
      const res = await fetch(`/api/analytics/ticket-promedio?${params}`)
      if (!res.ok) throw new Error('Failed to fetch ticket analytics')
      return res.json()
    },
    enabled: !!storeId && !!dateRange.from && !!dateRange.to,
    staleTime: 60 * 1000
  })
}

// ============================================
// New Clients Hook
// ============================================
export interface NewClientsAnalytics {
  clients: Array<{
    id: string
    name: string
    phone: string | null
    email: string | null
    address: {
      street: string | null
      numeroExterior: string | null
      colonia: string | null
      codigoPostal: string | null
      ciudad: string | null
    }
    registeredAt: string
    vendedor: {
      id: string
      name: string
      phone: string | null
    } | null
    hasVendor: boolean
  }>
  summary: {
    total: number
    withVendor: number
    withoutVendor: number
    byVendor: Array<{
      vendorName: string
      count: number
    }>
    period: { from: string; to: string }
  }
}

export function useNewClientsAnalytics(
  storeId: string,
  dateRange: { from: string; to: string }
) {
  return useQuery({
    queryKey: ['analytics', 'new-clients', storeId, dateRange],
    queryFn: async (): Promise<NewClientsAnalytics> => {
      const params = new URLSearchParams({
        store_id: storeId,
        from: dateRange.from,
        to: dateRange.to
      })
      const res = await fetch(`/api/analytics/new-clients?${params}`)
      if (!res.ok) throw new Error('Failed to fetch new clients')
      return res.json()
    },
    enabled: !!storeId && !!dateRange.from && !!dateRange.to,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}
