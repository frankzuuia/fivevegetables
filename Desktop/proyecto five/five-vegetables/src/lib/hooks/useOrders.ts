import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { OrderShadow, OrderItem, CreateOrderInput } from '@/types/database'

// Type para order con relaciones
export type OrderWithDetails = OrderShadow & {
  clients_mirror: { name: string; email: string | null } | null
  order_items: OrderItem[]
}

// Hook para obtener orders
export function useOrders(
  clienteId?: string
): UseQueryResult<OrderWithDetails[], Error> {
  return useQuery({
    queryKey: ['orders', clienteId] as const,
    queryFn: async (): Promise<OrderWithDetails[]> => {
      const supabase = createBrowserClient()
      let query = supabase
        .from('orders_shadow')
        .select(`
          *,
          clients_mirror!inner (name, email),
          order_items (*)
        `)
        .order('created_at', { ascending: false })
      
      if (clienteId) {
        query = query.eq('cliente_id', clienteId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return (data as OrderWithDetails[]) || []
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!clienteId,
  })
}

// Hook para order individual
export function useOrder(
  orderId: string
): UseQueryResult<OrderWithDetails | null, Error> {
  return useQuery({
    queryKey: ['order', orderId] as const,
    queryFn: async (): Promise<OrderWithDetails | null> => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('orders_shadow')
        .select(`
          *,
          clients_mirror!inner (name, email),
          order_items (*)
        `)
        .eq('id', orderId)
        .single()
      
      if (error) throw error
      return data as OrderWithDetails
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!orderId,
  })
}

// Mutation para crear order
export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error creating order')
      }
      
      return res.json()
    },
    onSuccess: () => {
      // Invalidar queries de orders para refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error) => {
      console.error('Error creating order:', error)
    },
  })
}
