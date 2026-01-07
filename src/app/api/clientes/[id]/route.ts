// =====================================================
// API: Get Cliente by ID
// Retorna datos del cliente incluyendo price_list_id
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: client, error } = await supabase
      .from('clients_mirror')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error: any) {
    console.error('Error fetching client:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
