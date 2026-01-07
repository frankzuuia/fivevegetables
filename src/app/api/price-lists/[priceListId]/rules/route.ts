// =====================================================
// API: Guardar Reglas de Lista de Precios
// Guarda reglas específicas por producto
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ priceListId: string }> }
) {
  try {
    const { priceListId } = await params
    const supabase = await createClient()
    const { rules } = await request.json()

    // Get price list with odoo_pricelist_id
    const { data: priceList, error: plError } = await supabase
      .from('price_lists')
      .select('odoo_pricelist_id')
      .eq('id', priceListId)
      .single()

    if (plError || !priceList) {
      console.error('[price-list-rules] Error fetching price list:', plError)
      return NextResponse.json({ error: 'Lista de precios no encontrada' }, { status: 404 })
    }

    // Eliminar reglas existentes
    await supabase
      .from('price_list_items')
      .delete()
      .eq('price_list_id', priceListId)

    // Insertar nuevas reglas en Supabase
    if (rules && rules.length > 0) {
      const itemsToInsert = rules.map((rule: any) => ({
        price_list_id: priceListId,
        product_id: rule.product_id,
        compute_price: rule.compute_price,
        fixed_price: rule.fixed_price || null,
        percent_price: rule.percent_price || null,
        min_quantity: 0
      }))

      const { error: insertError } = await supabase
        .from('price_list_items')
        .insert(itemsToInsert)

      if (insertError) {
        console.error('[price-list-rules] Error inserting rules:', insertError)
        throw insertError
      }
    }

    // Sync to Odoo if price list has odoo_pricelist_id
    if (priceList.odoo_pricelist_id && rules && rules.length > 0) {
      try {
        const { updatePriceListItemsInOdoo } = await import('@/lib/odoo/client')

        // Map rules to Odoo format con odoo_product_id
        const odooItems = await Promise.all(
          rules.map(async (rule: any) => {
            // Get odoo_product_id from products_cache
            const { data: product } = await supabase
              .from('products_cache')
              .select('odoo_product_id')
              .eq('id', rule.product_id)
              .single()

            return {
              product_id: product?.odoo_product_id || 0,
              compute_price: rule.compute_price,
              fixed_price: rule.fixed_price,
              percent_price: rule.percent_price,
            }
          })
        )

        await updatePriceListItemsInOdoo(priceList.odoo_pricelist_id, odooItems)
        console.log('[price-list-rules] Synced to Odoo successfully')
      } catch (odooError) {
        console.error('[price-list-rules] Error syncing to Odoo:', odooError)
        // Continue even if Odoo fails
      }
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
  { params }: { params: Promise<{ priceListId: string }> }
) {
  try {
    const { priceListId } = await params
    const supabase = await createClient()

    const { data: items, error } = await supabase
      .from('price_list_items')
      .select('*')
      .eq('price_list_id', priceListId)

    if (error) throw error

    // Get product names from products_cache
    const rules = await Promise.all(
      (items || []).map(async (item) => {
        const { data: product } = await supabase
          .from('products_cache')
          .select('name')
          .eq('id', item.product_id)
          .single()

        return {
          id: item.id,
          product_id: item.product_id,
          product_name: product?.name || 'Producto desconocido',
          compute_price: item.compute_price,
          fixed_price: item.fixed_price,
          percent_price: item.percent_price
        }
      })
    )

    return NextResponse.json({ rules })
  } catch (error: any) {
    console.error('Error fetching price list rules:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
