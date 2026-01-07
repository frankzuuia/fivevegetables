// =====================================================
// API: Guardar Reglas de Lista de Precios
// Guarda reglas específicas por producto
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { priceListId: string } }
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

    const { rules } = await request.json()

    // Verificar que la pricelist pertenece al store del usuario
    const storeId = user.user_metadata?.store_id
    const { data: priceList } = await supabase
      .from('price_lists')
      .select('id')
      .eq('id', params.priceListId)
      .eq('store_id', storeId)
      .single()

    if (!priceList) {
      return NextResponse.json({ error: 'Lista de precios no encontrada' }, { status: 404 })
    }

    // Eliminar reglas existentes
    await supabase
      .from('price_list_items')
      .delete()
      .eq('price_list_id', params.priceListId)

    // Insertar nuevas reglas
    if (rules && rules.length > 0) {
      const itemsToInsert = rules.map((rule: any) => ({
        price_list_id: params.priceListId,
        product_id: rule.product_id,
        compute_price: rule.compute_price,
        fixed_price: rule.fixed_price || null,
        percent_price: rule.percent_price || null,
        min_quantity: 0
      }))

      const { error: insertError } = await supabase
        .from('price_list_items')
        .insert(itemsToInsert)

      if (insertError) throw insertError
    }

    return NextResponse.json({
      success: true,
      message: `${rules.length} reglas guardadas`
    })
  } catch (error: any) {
    console.error('Error saving price list rules:', error)
    return NextResponse.json({ error: error.message || 'Error al guardar reglas' }, { status: 500 })
  }
}

// GET: Obtener reglas de una lista
export async function GET(
  request: NextRequest,
  { params }: { params: { priceListId: string } }
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

    const { data: items, error } = await supabase
      .from('price_list_items')
      .select(`
        *,
        products (
          id,
          name,
          price,
          unit
        )
      `)
      .eq('price_list_id', params.priceListId)

    if (error) throw error

    // Mapear para incluir product_name
    const rules = items?.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: (item.products as any)?.name || 'Producto desconocido',
      compute_price: item.compute_price,
      fixed_price: item.fixed_price,
      percent_price: item.percent_price
    }))

    return NextResponse.json({ rules })
  } catch (error: any) {
    console.error('Error fetching price list rules:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
