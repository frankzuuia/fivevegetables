// =====================================================
// HOOKS: Gestión de Clientes
// useAsignarVendedor, useVendedores, etc.
// =====================================================

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { asignarVendedor } from '@/app/actions/clientes'
import { createClient } from '@/lib/supabase/client'

// =====================================================
// useAsignarVendedor - Mutation para asignar vendedor
// =====================================================

export function useAsignarVendedor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: {
      clienteId: string
      vendedorId: string
      pricelistId: string
    }) => {
      const result = await asignarVendedor(input)
      
      if (!result.success) {
        throw new Error(result.error || 'Error al asignar vendedor')
      }
      
      return result
    },
    onSuccess: () => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['clientes-sin-asignar'] })
      queryClient.invalidateQueries({ queryKey: ['all-clientes'] })
      queryClient.invalidateQueries({ queryKey: ['vendedor-clientes'] })
    },
  })
}

// =====================================================
// useClientesSinAsignar - Query para lista sin asignar
// =====================================================

export function useClientesSinAsignar() {
  return useQuery({
    queryKey: ['clientes-sin-asignar'],
    queryFn: async () => {
      const res = await fetch('/api/clientes/sin-asignar')
      if (!res.ok) {
        throw new Error('Error al obtener clientes sin asignar')
      }
      return res.json()
    },
  })
}

// =====================================================
// useVendedores - Query para lista vendedores del store
// =====================================================

export function useVendedores(storeId: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['vendedores', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('store_id', storeId)
        .eq('role', 'vendedor')
        .order('full_name')
      
      if (error) throw error
      return data
    },
    enabled: !!storeId,
  })
}

// =====================================================
// useAllClientes - Query para todos los clientes (gerente)
// =====================================================

export function useAllClientes(searchTerm?: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['all-clientes', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('clients_mirror')
        .select(`
          *,
          vendedor:profiles!vendedor_id(full_name),
          pricelist:price_lists(name, discount_percentage)
        `)
        .order('name')
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Transform data
      return data?.map((cliente: any) => ({
        ...cliente,
        vendedor_name: cliente.vendedor?.full_name || null,
        pricelist_name: cliente.pricelist?.name || null,
      }))
    },
  })
}

// =====================================================
// useCrearCliente - Mutation para crear cliente (vendedor)
// =====================================================

export function useCrearCliente() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: {
      nombre: string
      telefono: string
      email?: string
      nombreRestaurant: string
      calle: string
      numeroExterior: string
      numeroInterior?: string
      colonia: string
      entreCalles: string
      codigoPostal: string
      ciudad?: string
      estado?: string
      referencias?: string
      pricelistId: string
      requiereFactura?: boolean
    }) => {
      const { crearClienteVendedor } = await import('@/app/actions/clientes')
      const result = await crearClienteVendedor({
        ...input,
        ciudad: input.ciudad || 'Guadalajara',
        estado: input.estado || 'Jalisco',
        requiereFactura: input.requiereFactura || false,
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Error al crear cliente')
      }
      
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-clientes'] })
      queryClient.invalidateQueries({ queryKey: ['vendedor-clientes'] })
    },
  })
}
