import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProductsWithStock } from '@/lib/odoo/client'

// =====================================================
// POST /api/sync/products
// Sincroniza productos de Odoo a Supabase
// Se ejecuta automáticamente via cron o manualmente
// =====================================================

const DEFAULT_STORE_ID = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

export async function POST(request: NextRequest) {
  try {
    console.log('[Product Sync] Starting sync from Odoo to Supabase...')

    // 1. Obtener productos de Odoo
    const odooProducts = await getProductsWithStock()
    console.log(`[Product Sync] Found ${odooProducts.length} products in Odoo`)

    if (!odooProducts || odooProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay productos en Odoo para sincronizar',
        synced: 0,
      })
    }

    // 2. Conectar a Supabase
    const supabase = await createClient()

    // 3. Procesar cada producto
    let syncedCount = 0
    let errorCount = 0

    for (const product of odooProducts) {
      try {
        // Mapear campos de Odoo a Supabase
        const productData = {
          store_id: DEFAULT_STORE_ID,
          odoo_product_id: product.id,
          name: product.name || 'Sin nombre',
          description: product.description || null,
          image_url: product.image_1920
            ? `data:image/png;base64,${product.image_1920}`
            : null,
          list_price: product.list_price || 0,
          stock_level: product.qty_available || 0,
          category: Array.isArray(product.categ_id) ? product.categ_id[1] : 'General',
          uom: 'kg', // Puedes adaptar esto según tu lógica
          active: true,
          last_sync: new Date().toISOString(),
        }

        // Upsert: insertar o actualizar si ya existe
        const { error } = await supabase
          .from('products_cache')
          .upsert(productData, {
            onConflict: 'odoo_product_id',
            ignoreDuplicates: false,
          })

        if (error) {
          console.error(`[Product Sync] Error syncing product ${product.id}:`, error)
          errorCount++
        } else {
          syncedCount++
        }
      } catch (productError) {
        console.error(`[Product Sync] Error processing product ${product.id}:`, productError)
        errorCount++
      }
    }

    console.log(`[Product Sync] Completed. Synced: ${syncedCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Sincronización completada`,
      synced: syncedCount,
      errors: errorCount,
      total: odooProducts.length,
    })

  } catch (error) {
    console.error('[Product Sync] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// GET /api/sync/products
// Permite ejecutar sync manualmente (protegido)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Validar que solo gerentes puedan ejecutar manualmente
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'gerente' && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo gerentes pueden ejecutar sync manual' },
        { status: 403 }
      )
    }

    // Ejecutar sync (reutilizar lógica del POST)
    return POST(request)

  } catch (error) {
    console.error('[Product Sync GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar sincronización' },
      { status: 500 }
    )
  }
}
