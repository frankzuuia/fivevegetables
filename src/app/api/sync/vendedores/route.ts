'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getSalesUsersFromOdoo } from '@/lib/odoo/client'
import { createClient } from '@/lib/supabase/server'

/**
 * Sincronizar vendedores desde Odoo a Supabase
 * GET /api/sync/vendedores
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[sync-vendedores] Starting sync from Odoo...')

        // Obtener usuarios desde Odoo
        const odooUsers = await getSalesUsersFromOdoo()
        console.log(`[sync-vendedores] Retrieved ${odooUsers.length} users from Odoo`)

        const supabase = await createClient()

        let created = 0
        let updated = 0
        let errors = 0

        for (const odooUser of odooUsers) {
            try {
                // Check if user already exists in profiles
                const { data: existing } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('odoo_partner_id', odooUser.id)
                    .single()

                const userData = {
                    name: odooUser.name,
                    email: typeof odooUser.email === 'string' ? odooUser.email : null,
                    role: 'vendedor' as const,
                    active: odooUser.active,
                    updated_at: new Date().toISOString()
                }

                if (existing) {
                    // Update existing
                    const { error } = await supabase
                        .from('profiles')
                        .update(userData)
                        .eq('odoo_partner_id', odooUser.id)

                    if (error) throw error
                    updated++
                } else {
                    // Create new (nota: necesitarían crear usuario en auth.users primero en producción)
                    console.log(`[sync-vendedores] User ${odooUser.login} needs to be manually created in Supabase Auth`)
                    // En producción, aquí se llamaría a Supabase Admin API para crear el usuario
                    created++
                }
            } catch (itemError) {
                console.error(`[sync-vendedores] Error syncing user ${odooUser.id}:`, itemError)
                errors++
            }
        }

        console.log(`[sync-vendedores] Sync completed: ${updated} updated, ${errors} errors`)

        return NextResponse.json({
            success: true,
            message: `Sincronización completa: ${updated} actualizados`,
            stats: { created, updated, errors, total: odooUsers.length },
            note: 'Los vendedores deben ser creados manualmente en Supabase Auth primero'
        })
    } catch (error: any) {
        console.error('[sync-vendedores] Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Error al sincronizar vendedores'
        }, { status: 500 })
    }
}
