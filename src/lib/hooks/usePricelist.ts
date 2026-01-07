import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import type { UpdatePricelistInput, PriceList } from '@/types/database'

// Mutation para actualizar pricelist de cliente (CONTROL REMOTO PRECIOS)
export function useUpdatePricelist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePricelistInput) => {
      const res = await fetch('/api/prices/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error updating pricelist')
      }

      return res.json()
    },
    onMutate: async (variables) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['clients', variables.client_id] })

      const previousClient = queryClient.getQueryData(['clients', variables.client_id])

      queryClient.setQueryData(['clients', variables.client_id], (old: unknown) => {
        if (typeof old === 'object' && old !== null) {
          return {
            ...(old as Record<string, unknown>),
            pricelist_id: variables.new_pricelist_id,
          }
        }
        return old
      })

      return { previousClient }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(['clients', variables.client_id], context.previousClient)
      }
    },
    onSettled: () => {
      // Refetch después de mutation
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// Hook para obtener pricelists disponibles
export function usePriceLists(
  storeId: string
): UseQueryResult<PriceList[], Error> {
  return useQuery({
    queryKey: ['priceLists', storeId] as const,
    queryFn: async (): Promise<PriceList[]> => {
      const res = await fetch(`/api/price-lists?store_id=${storeId}`)
      if (!res.ok) throw new Error('Error fetching price lists')
      return res.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (no cambian frecuentemente)
    enabled: !!storeId,
  })
}
