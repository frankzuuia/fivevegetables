import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase/client'
import type { ProductCache } from '@/types/database'

// Query options pattern (reusable, type-safe)
export const productsQueryOptions = (storeId: string) => ({
  queryKey: ['products', storeId] as const,
  queryFn: async (): Promise<ProductCache[]> => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('products_cache')
      .select('*')
      .eq('store_id', storeId)
      .eq('active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
})

// Hook principal
export function useProducts(storeId: string): UseQueryResult<ProductCache[], Error> {
  return useQuery(productsQueryOptions(storeId))
}

// Hook con filtro por categoría
export function useProductsByCategory(
  storeId: string,
  category: string | null
): UseQueryResult<ProductCache[], Error> {
  return useQuery({
    queryKey: ['products', storeId, 'category', category] as const,
    queryFn: async (): Promise<ProductCache[]> => {
      const supabase = createBrowserClient()
      let query = supabase
        .from('products_cache')
        .select('*')
        .eq('store_id', storeId)
        .eq('active', true)
      
      if (category) {
        query = query.eq('category', category)
      }
      
      const { data, error } = await query.order('name')
      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!storeId,
  })
}

// Hook para producto individual
export function useProduct(
  productId: string
): UseQueryResult<ProductCache | null, Error> {
  return useQuery({
    queryKey: ['product', productId] as const,
    queryFn: async (): Promise<ProductCache | null> => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('products_cache')
        .select('*')
        .eq('id', productId)
        .single()
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!productId,
  })
}

// Hook para catálogo cliente (precios personalizados)
export function useProductsCatalog() {
  return useQuery({
    queryKey: ['products-catalog'],
    queryFn: async () => {
      const res = await fetch('/api/products/catalog')
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al obtener catálogo')
      }
      
      return res.json()
    },
    retry: 1,
  })
}
