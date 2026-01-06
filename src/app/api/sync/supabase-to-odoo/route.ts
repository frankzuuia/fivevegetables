import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSaleOrder } from '@/lib/odoo/client'

// =====================================================
// POST /api/sync/supabase-to-odoo
// Sincronización Supabase → Odoo (Pedidos pendientes)
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 1. VERIFICAR AUTHORIZATION (puede ser webhook o cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = await createClient()
    const startTime = Date.now()

    const result = {
      success: true,
      ordersSynced: 0,
      errors: [] as string[],
      duration: 0,
    }

    // 2. OBTENER PEDIDOS SIN SINCRONIZAR (odoo_order_id IS NULL)
    const { data: pendingOrders, error: queryError } = await supabase
      .from('orders_shadow')
      .select(`
        id,
        order_number,
        cliente_id,
        notes,
        clients_mirror!inner (
          odoo_partner_id
        ),
        order_items (
          odoo_product_id,
          quantity,
          unit_price
        )
      `)
      .is('odoo_order_id', null)
      .neq('status', 'cancelled')
      .limit(20) // Procesar máximo 20 por ejecución

    if (queryError) {
      console.error('[Sync Query Error]', queryError)
      return NextResponse.json(
        { success: false, error: queryError.message },
        { status: 500 }
      )
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('[Sync] No hay pedidos pendientes de sincronizar')
      return NextResponse.json({
        success: true,
        result: { ordersSynced: 0, message: 'No pending orders' },
      })
    }

    console.log(`[Sync] Procesando ${pendingOrders.length} pedidos pendientes...`)

    // 3. PROCESAR CADA PEDIDO
    for (const order of pendingOrders) {
      try {
        const cliente = order.clients_mirror as unknown as { odoo_partner_id: number }
        const items = order.order_items as Array<{
          odoo_product_id: number
          quantity: number
          unit_price: number
        }>

        if (!cliente || !cliente.odoo_partner_id) {
          result.errors.push(
            `Order ${order.order_number}: Cliente sin odoo_partner_id`
          )
          continue
        }

        if (!items || items.length === 0) {
          result.errors.push(`Order ${order.order_number}: Sin items`)
          continue
        }

        // 4. CREAR PEDIDO EN ODOO
        const odooOrderLine = items.map((item) => ({
          product_id: item.odoo_product_id,
          product_uom_qty: item.quantity,
          price_unit: item.unit_price,
        }))

        const odooOrderId = await createSaleOrder({
          partner_id: cliente.odoo_partner_id,
          order_line: odooOrderLine,
          note: order.notes || `Pedido desde App: ${order.order_number}`,
        })

        // 5. ACTUALIZAR SUPABASE CON odoo_order_id
        const { error: updateError } = await supabase
          .from('orders_shadow')
          .update({
            odoo_order_id: odooOrderId,
            synced_at: new Date().toISOString(),
            status: 'confirmed', // Cambiar a confirmed una vez synced
          })
          .eq('id', order.id)

        if (updateError) {
          result.errors.push(
            `Order ${order.order_number}: Error actualizando: ${updateError.message}`
          )
        } else {
          result.ordersSynced++
          console.log(
            `[Sync Success] Order ${order.order_number} → Odoo ID: ${odooOrderId}`
          )
        }
      } catch (orderError) {
        const errorMsg =
          orderError instanceof Error ? orderError.message : 'Error desconocido'
        result.errors.push(`Order ${order.order_number}: ${errorMsg}`)
        console.error(
          `[Sync Order Error] ${order.order_number}:`,
          orderError
        )
      }
    }

    result.duration = Date.now() - startTime

    console.log('[Sync] Finalizado:', result)

    return NextResponse.json({
      success: result.errors.length === 0,
      result,
    })
  } catch (error) {
    console.error('[Sync Supabase to Odoo Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
