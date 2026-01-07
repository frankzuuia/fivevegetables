'use server'

import { NextResponse } from 'next/server'
import { getUnitsOfMeasureFromOdoo } from '@/lib/odoo/client'

/**
 * Obtener unidades de medida desde Odoo
 * GET /api/uoms
 */
export async function GET() {
    try {
        console.log('[uoms] Fetching from Odoo...')

        const uoms = await getUnitsOfMeasureFromOdoo()
        console.log(`[uoms] Retrieved ${uoms.length} units`)

        return NextResponse.json({
            success: true,
            uoms: uoms.map(uom => ({
                id: uom.id,
                name: uom.name
            }))
        })
    } catch (error: any) {
        console.error('[uoms] Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Error al obtener unidades de medida'
        }, { status: 500 })
    }
}
