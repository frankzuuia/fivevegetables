// =====================================================
// API: Sync Price Lists from Odoo
// Sincroniza listas de precios desde Odoo a Supabase
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchOdooPricelists, fetchPricelistItems } from '@/lib/odoo/pricelist-sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Use default store ID (auth protected at UI level)
    const storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

    console.log('[sync-pricelists] Starting sync for store:', storeId)

    // Obtener credenciales de Odoo desde Supabase
    const { data: odooConfig } = await supabase
      .from('odoo_config')
      .select('*')
      .eq('store_id', storeId)
      .single()

    if (!odooConfig) {
      return NextResponse.json({ error: 'Configuración de Odoo no encontrada' }, { status: 400 })
    }

    const { url, database, username, password } = odooConfig

    // 1. Obtener listas de precios desde Odoo
    console.log('Fetching pricelists from Odoo...')
    const odooPricelists = await fetchOdooPricelists(url, database, username, password)
    console.log(`Found ${odooPricelists.length} pricelists in Odoo`)

    let syncedPricelists = 0
    let syncedItems = 0

    // 2. Sincronizar cada lista
    for (const odooPricelist of odooPricelists) {
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('price_lists')
        .select('id')
        .eq('odoo_id', odooPricelist.id)
        .single()

      const currencyCode = Array.isArray(odooPricelist.currency_id)
        ? odooPricelist.currency_id[1]
        : 'MXN'

      if (existing) {
        // Actualizar existente
        await supabase
          .from('price_lists')
          .update({
            name: odooPricelist.name,
            currency: currencyCode,
            active: odooPricelist.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        console.log(`Updated pricelist: ${odooPricelist.name}`)
      } else {
        // Crear nueva
        const { data: newPricelist } = await supabase
          .from('price_lists')
          .insert({
            odoo_id: odooPricelist.id,
            name: odooPricelist.name,
            store_id: storeId,
            currency: currencyCode,
            active: odooPricelist.active
          })
          .select()
          .single()

        console.log(`Created pricelist: ${odooPricelist.name}`)
        syncedPricelists++

        // 3. Obtener y sincronizar items/reglas de esta lista
        if (newPricelist) {
          const items = await fetchPricelistItems(url, database, username, password, odooPricelist.id)
          console.log(`Found ${items.length} items for pricelist ${odooPricelist.name}`)

          for (const item of items) {
            // Mapear product_tmpl_id a product_id si existe
            let productId = null
            if (item.product_tmpl_id) {
              const odooProductId = item.product_tmpl_id[0]
              const { data: product } = await supabase
                .from('products')
                .select('id')
                .eq('odoo_id', odooProductId)
                .single()

              productId = product?.id || null
            }

            // Mapear categ_id si existe
            let categoryId = null
            if (item.categ_id) {
              const odooCategoryId = item.categ_id[0]
              const { data: category } = await supabase
                .from('categories')
                .select('id')
                .eq('odoo_id', odooCategoryId)
                .single()

              categoryId = category?.id || null
            }

            await supabase.from('price_list_items').insert({
              price_list_id: newPricelist.id,
              odoo_id: item.id,
              product_id: productId,
              category_id: categoryId,
              min_quantity: item.min_quantity,
              date_start: item.date_start || null,
              date_end: item.date_end || null,
              compute_price: item.compute_price,
              fixed_price: item.fixed_price || null,
              percent_price: item.percent_price || null
            })

            syncedItems++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronizados ${syncedPricelists} listas de precios y ${syncedItems} reglas desde Odoo`,
      pricelists: syncedPricelists,
      items: syncedItems
    })
  } catch (error: any) {
    console.error('Error syncing pricelists from Odoo:', error)
    return NextResponse.json({ error: error.message || 'Error al sincronizar listas de precios' }, { status: 500 })
  }
}
