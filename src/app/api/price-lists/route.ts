// =====================================================
// API: Create Price List (Dashboard → Odoo)
// Crea lista en dashboard Y en Odoo automáticamente
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOdooPricelist } from '@/lib/odoo/pricelist-sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[price-lists] Auth error:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let storeId = user.user_metadata?.store_id

    // Fallback: Buscar en tabla profiles si no está en metadata
    if (!storeId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        storeId = profile.store_id
      }
    }

    console.log('[price-lists] User:', user.email, 'Store ID:', storeId)

    if (!storeId) {
      return NextResponse.json({ error: 'No se encontró store_id' }, { status: 400 })
    }

    // Leer datos del body
    const { name, discountPercent, type } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 })
    }

    // Obtener config de Odoo
    const { data: odooConfig } = await supabase
      .from('odoo_config')
      .select('*')
      .eq('store_id', storeId)
      .single()

    let odooId: number | null = null

    // 1. Crear en Odoo primero (si hay config)
    if (odooConfig) {
      try {
        const { url, database, username, password } = odooConfig
        odooId = await createOdooPricelist(url, database, username, password, name, discountPercent || 0)
        console.log(`Created pricelist in Odoo with ID: ${odooId}`)
      } catch (odooError) {
        console.error('Error creating in Odoo:', odooError)
        // Continuamos aunque falle Odoo
      }
    }

    // 2. Crear en Supabase local
    const { data: newPricelist, error: dbError } = await supabase
      .from('price_lists')
      .insert({
        name,
        store_id: storeId,
        discount_percent: discountPercent || 0,
        type: type || 'standard',
        odoo_id: odooId,
        active: true
      })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    return NextResponse.json({
      success: true,
      message: odooId ? 'Lista creada en Dashboard y Odoo' : 'Lista creada en Dashboard',
      pricelist: newPricelist,
      odooId
    })
  } catch (error: any) {
    console.error('Error creating pricelist:', error)
    return NextResponse.json({ error: error.message || 'Error al crear lista de precios' }, { status: 500 })
  }
}

// Listar listas de precios
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let storeId = user.user_metadata?.store_id

    // Fallback: Buscar en tabla profiles si no está en metadata
    if (!storeId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        storeId = profile.store_id
      }
    }

    if (!storeId) {
      return NextResponse.json({ error: 'No se encontró store_id' }, { status: 400 })
    }

    const { data: pricelists, error } = await supabase
      .from('price_lists')
      .select('*')
      .eq('store_id', storeId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ pricelists })
  } catch (error: any) {
    console.error('Error fetching pricelists:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
