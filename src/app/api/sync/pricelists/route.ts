'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getPriceListsFromOdoo } from '@/lib/odoo/client'
import { createClient } from '@/lib/supabase/server'

/**
 * Sincronizar listas de precios desde Odoo a Supabase
 * GET /api/sync/pricelists
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[sync-pricelists] Starting sync from Odoo...')

        //  Obtener listas desde Odoo
        const odooLists = await getPriceListsFromOdoo()
        console.log(`[sync-pricelists] Retrieved ${odooLists.length} lists from Odoo`)

        const supabase = await createClient()
        const storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

        let created = 0
        let updated = 0
        let errors = 0

        for (const odooList of odooLists) {
            try {
                // Check if already exists in Supabase
                const { data: existing } = await supabase
                    .from('price_lists')
                    .select('id')
                    .eq('odoo_pricelist_id', odooList.id)
                    .single()

                if (existing) {
                    // Update existing
                    const { error } = await supabase
                        .from('price_lists')
                        .update({
                            name: odooList.name,
                            active: odooList.active,
                            updated_at: new Date().toISOString()
                        })
                        .eq('odoo_pricelist_id', odooList.id)

                    if (error) throw error
                    updated++
                } else {
                    // Create new
                    const { error } = await supabase
                        .from('price_lists')
                        .insert({
                            name: odooList.name,
                            store_id: storeId,
                            odoo_pricelist_id: odooList.id,
                            active: odooList.active,
                            type: 'standard',
                            discount_percentage: 0
                        })

                    if (error) throw error
                    created++
                }
            } catch (itemError) {
                console.error(`[sync-pricelists] Error syncing list ${odooList.id}:`, itemError)
                errors++
            }
        }

        console.log(`[sync-pricelists] Sync completed: ${created} created, ${updated} updated, ${errors} errors`)

        return NextResponse.json({
            success: true,
            message: `Sincronización completa: ${created} creadas, ${updated} actualizadas`,
            stats: { created, updated, errors, total: odooLists.length }
        })
    } catch (error: any) {
        console.error('[sync-pricelists] Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Error al sincronizar listas de precios'
        }, { status: 500 })
    }
}
