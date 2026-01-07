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

    // Use default store (UI already protects this endpoint)
    const storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

    console.log('[price-lists] Creating price list for store:', storeId)

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
        discount_percentage: discountPercent || 0,
        type: type || 'standard',
        odoo_id: odooId,
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
    console.error('[price-lists POST] Error creating pricelist:', error)
    console.error('[price-lists POST] Error name:', error.name)
    console.error('[price-lists POST] Error message:', error.message)
    console.error('[price-lists POST] Error code:', error.code)
    console.error('[price-lists POST] Error details:', error.details)
    return NextResponse.json({
      error: error.message || 'Error al crear lista de precios',
      details: error.code || error.name
    }, { status: 500 })
  }
}

// Listar listas de precios
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Use default store
    const storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

    const { data: pricelists, error } = await supabase
      .from('price_lists')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ pricelists })
  } catch (error: any) {
    console.error('Error fetching pricelists:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
