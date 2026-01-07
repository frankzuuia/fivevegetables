// =====================================================
// API ROUTE: Clientes Sin Asignar
// Lista clientes nuevos sin vendedor (solo gerente)
// =====================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 3. FETCH CLIENTES SIN VENDEDOR (verificando join con profiles)
    const { data: clientes, error: fetchError } = await supabase
      .from('clients_mirror')
      .select(`
        *,
        vendedor:profiles!vendedor_id(full_name)
      `)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('[API Clientes Sin Asignar Error]', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }
    
    // Filter clients where vendedor is null (either no vendedor_id or join failed)
    
    const clientesSinAsignar = clientes?.filter((cliente: any) => {
        // Un cliente está sin asignar si:
        // 1. No tiene objeto 'vendedor'
        // 2. Tiene objeto pero full_name está vacío
        // 3. vendedor_id es null (explicito)
        if (!cliente.vendedor) return true
        if (Array.isArray(cliente.vendedor) && cliente.vendedor.length === 0) return true
        if (typeof cliente.vendedor === 'object' && !cliente.vendedor.full_name) return true
        
        return false
    }) || []
    
    return NextResponse.json(clientesSinAsignar)
    
  } catch (error) {
    console.error('[API Clientes Sin Asignar Error]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
