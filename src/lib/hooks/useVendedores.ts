// =====================================================
// HOOKS: Vendedores Management
// Para gerente eliminar vendedor + reasignación
// =====================================================

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface Vendedor {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  created_at: string
}

interface ClienteVendedor {
  id: string
name: string
  email: string | null
  phone: string | null
}

// Query vendedores activos
export function useVendedoresActivos(storeId?: string) {
  const supabase = createClient()
  
  return useQuery<Vendedor[]>({
    queryKey: ['vendedores-activos', storeId],
    queryFn: async (): Promise<Vendedor[]> => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, created_at')
        .eq('role', 'vendedor')
        .eq('active', true)
        .order('full_name')
      
      if (storeId) {
        query = query.eq('store_id', storeId)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return (data as Vendedor[]) || []
    },
    enabled: !!storeId,
  })
}

// Query clientes de un vendedor específico
export function useClientesVendedor(vendedorId: string) {
  const supabase = createClient()
  
  return useQuery<ClienteVendedor[]>({
    queryKey: ['clientes-vendedor', vendedorId],
    queryFn: async (): Promise<ClienteVendedor[]> => {
      const { data, error } = await supabase
        .from('clients_mirror')
        .select('id, name, email, phone')
        .eq('vendedor_id', vendedorId)
        .order('name')
      
      if (error) throw error
      return (data as ClienteVendedor[]) || []
    },
    enabled: !!vendedorId,
  })
}

// Mutation eliminar vendedor
export function useEliminarVendedor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: {
      vendedorId: string
      clientesReasignacion: Array<{ clienteId: string; nuevoVendedorId: string }>
    }) => {
      const { eliminarVendedor } = await import('@/app/actions/vendedores')
      const result = await eliminarVendedor(input)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendedores-activos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes-vendedor'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
