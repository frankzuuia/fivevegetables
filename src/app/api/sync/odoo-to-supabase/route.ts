import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getProductsWithStock,
  getPriceLists,
  getPartners,
  getOrderInvoiceStatus,
  getSaleOrders,
} from '@/lib/odoo/client'

// =====================================================
// POST /api/sync/odoo-to-supabase
// Sincronización Odoo → Supabase (Cron job)
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 1. VERIFICAR AUTHORIZATION (Cron secret para Vercel Cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = await createClient()
    const startTime = Date.now()

    // RESULTADO TRACKING
    const result = {
      success: true,
      productsSync: 0,
      pricelistsSync: 0,
      clientsSync: 0,
      ordersSync: 0,
      invoicesSync: 0,
      errors: [] as string[],
      duration: 0,
    }

    // 2. SYNC PRODUCTOS (product.product)
    try {
      console.log('[Sync] Obteniendo productos desde Odoo...')
      const odooProducts = await getProductsWithStock()

      for (const product of odooProducts) {
        const { error } = await supabase.from('products_cache').upsert(
          {
            odoo_product_id: product.id,
            name: product.name || 'Sin nombre',
            description: product.description || null,
            image_url: product.image_1920
              ? `data:image/png;base64,${product.image_1920}`
              : null,
            list_price: product.list_price || 0,
            stock_level: product.qty_available || 0,
            category: product.categ_id?.[1] || null,
            uom: Array.isArray(product.uom_id) ? product.uom_id[1] : 'kg',
            active: true,
            last_sync: new Date().toISOString(),
            // store_id se debe setear manualmente o con default
          },
          { onConflict: 'odoo_product_id' }
        )

        if (error) {
          result.errors.push(`Producto ${product.id}: ${error.message}`)
        } else {
          result.productsSync++
        }
      }

      console.log(`[Sync] ${result.productsSync} productos sincronizados`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      result.errors.push(`Productos: ${errorMsg}`)
      console.error('[Sync Products Error]', error)
    }

    // 3. SYNC PRICELISTS (product.pricelist)
    try {
      console.log('[Sync] Obteniendo pricelists desde Odoo...')
      const odooPricelists = await getPriceLists()

      for (const pricelist of odooPricelists) {
        const { error } = await supabase.from('price_lists').upsert(
          {
            odoo_pricelist_id: pricelist.id,
            name: pricelist.name || 'Sin nombre',
            // Note: type y discount_percentage deben configurarse manualmente o con defaults
            type: 'mayorista', // Default, ajustar según lógica
            discount_percentage: 0, // Default
          },
          { onConflict: 'odoo_pricelist_id' }
        )

        if (error) {
          result.errors.push(`Pricelist ${pricelist.id}: ${error.message}`)
        } else {
          result.pricelistsSync++
        }
      }

      console.log(`[Sync] ${result.pricelistsSync} pricelists sincronizadas`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      result.errors.push(`Pricelists: ${errorMsg}`)
      console.error('[Sync Pricelists Error]', error)
    }

    // 4. SYNC CLIENTES (res.partner)
    try {
      console.log('[Sync] Obteniendo clientes desde Odoo...')
      const odooPartners = await getPartners()

      for (const partner of odooPartners) {
        // Buscar pricelist_id en Supabase usando odoo_pricelist_id
        let pricelistId: string | null = null
        if (partner.property_product_pricelist) {
          const odooPricelistId = Array.isArray(partner.property_product_pricelist)
            ? partner.property_product_pricelist[0]
            : partner.property_product_pricelist

          const { data: pricelist } = await supabase
            .from('price_lists')
            .select('id')
            .eq('odoo_pricelist_id', odooPricelistId)
            .single()

          pricelistId = pricelist?.id || null
        }

        const { error } = await supabase.from('clients_mirror').upsert(
          {
            odoo_partner_id: partner.id,
            name: partner.name || 'Sin nombre',
            email: partner.email || null,
            phone: partner.phone || null,
            pricelist_id: pricelistId,
            odoo_pricelist_id: Array.isArray(partner.property_product_pricelist)
              ? partner.property_product_pricelist[0]
              : partner.property_product_pricelist,
            street: partner.street || null,
            city: partner.city || null,
            state: partner.state_id?.[1] || null,
            zip: partner.zip || null,
            last_sync: new Date().toISOString(),
          },
          { onConflict: 'odoo_partner_id' }
        )

        if (error) {
          result.errors.push(`Cliente ${partner.id}: ${error.message}`)
        } else {
          result.clientsSync++
        }
      }

      console.log(`[Sync] ${result.clientsSync} clientes sincronizados`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      result.errors.push(`Clientes: ${errorMsg}`)
      console.error('[Sync Clients Error]', error)
    }

    // 5. SYNC PEDIDOS (sale.order)
    try {
      console.log('[Sync] Obteniendo pedidos desde Odoo...')
      const odooOrders = await getSaleOrders()

      for (const order of odooOrders) {
        // Buscar cliente en Supabase por odoo_partner_id
        const { data: cliente } = await supabase
          .from('clients_mirror')
          .select('id, store_id')
          .eq('odoo_partner_id', Array.isArray(order.partner_id) ? order.partner_id[0] : order.partner_id)
          .single()

        if (!cliente) {
          console.warn(`[Sync] Cliente no encontrado para order ${order.id}`)
          continue
        }

        // Mapear estado de Odoo a estado de app
        const stateMap: Record<string, 'draft' | 'confirmed' | 'processing' | 'delivered' | 'cancelled'> = {
          'draft': 'draft',
          'sent': 'confirmed',
          'sale': 'processing',
          'done': 'delivered',
          'cancel': 'cancelled',
        }

        const status = stateMap[order.state] || 'draft'

        // Mapear invoice_status
        const invoiceStatusMap: Record<string, 'no' | 'to_invoice' | 'invoiced'> = {
          'no': 'no',
          'to invoice': 'to_invoice',
          'invoiced': 'invoiced',
        }

        const invoiceStatus = invoiceStatusMap[order.invoice_status] || 'no'

        const { error } = await supabase.from('orders_shadow').upsert(
          {
            store_id: cliente.store_id || process.env.NEXT_PUBLIC_DEFAULT_STORE_ID,
            odoo_order_id: order.id,
            cliente_id: cliente.id,
            order_number: order.name || `ORD-${order.id}`,
            status,
            invoice_status: invoiceStatus,
            subtotal: order.amount_total - order.amount_tax,
            tax: order.amount_tax,
            total: order.amount_total,
            request_invoice: invoiceStatus !== 'no',
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'odoo_order_id' }
        )

        if (error) {
          result.errors.push(`Pedido ${order.id}: ${error.message}`)
        } else {
          result.ordersSync++
        }
      }

      console.log(`[Sync] ${result.ordersSync} pedidos sincronizados`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      result.errors.push(`Pedidos: ${errorMsg}`)
      console.error('[Sync Orders Error]', error)
    }

    // 6. SYNC FACTURAS (invoice_status de orders)
    try {
      console.log('[Sync] Actualizando estado de facturas...')

      // Obtener orders que tienen odoo_order_id pero sin invoice_status actualizado
      const { data: ordersToCheck } = await supabase
        .from('orders_shadow')
        .select('id, odoo_order_id, invoice_status')
        .not('odoo_order_id', 'is', null)
        .in('invoice_status', ['to_invoice', 'no'])
        .limit(50) // Procesar máximo 50 por ejecución

      if (ordersToCheck && ordersToCheck.length > 0) {
        for (const order of ordersToCheck) {
          if (!order.odoo_order_id) continue

          const invoiceData = await getOrderInvoiceStatus(order.odoo_order_id)

          if (
            invoiceData.invoiceStatus === 'invoiced' &&
            order.invoice_status !== 'invoiced'
          ) {
            await supabase
              .from('orders_shadow')
              .update({
                invoice_status: 'invoiced',
                // invoice_pdf_url se puede obtener después si Odoo lo proporciona
              })
              .eq('id', order.id)

            result.invoicesSync++
          }
        }
      }

      console.log(`[Sync] ${result.invoicesSync} facturas actualizadas`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      result.errors.push(`Facturas: ${errorMsg}`)
      console.error('[Sync Invoices Error]', error)
    }

    // 6. CALCULAR DURACIÓN
    result.duration = Date.now() - startTime

    console.log('[Sync] Finalizado:', result)

    return NextResponse.json({
      success: result.errors.length === 0,
      result,
    })
  } catch (error) {
    console.error('[Sync Odoo to Supabase Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
