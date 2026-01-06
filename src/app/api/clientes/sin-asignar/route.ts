// =====================================================
// API ROUTE: Clientes Sin Asignar
// Lista clientes nuevos sin vendedor (solo gerente)
// =====================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 1. AUTH
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[API Sin Asignar] Auth error:', authError)
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // 2. ROLE CHECK (solo gerente)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'gerente') {
      return NextResponse.json(
        { error: 'Solo gerentes pueden ver clientes sin asignar' },
        { status: 403 }
      )
    }
    
    // 3. FETCH CLIENTES SIN VENDEDOR (null o string vacío)
    const { data: clientes, error: fetchError } = await supabase
      .from('clients_mirror')
      .select('*')
      .eq('store_id', profile.store_id)
      .or('vendedor_id.is.null,vendedor_id.eq.')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('[API Clientes Sin Asignar Error]', fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(clientes || [])
    
  } catch (error) {
    console.error('[API Clientes Sin Asignar Error]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
