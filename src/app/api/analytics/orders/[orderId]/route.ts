// =====================================================
// API ENDPOINT: Order Detail with Items
// Fetches complete order information including line items
// =====================================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = await createClient()
    const orderId = params.orderId

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Get order header
    const { data: order, error: orderError } = await supabase
      .from('orders_shadow')
      .select(`
        *,
        clients_mirror!orders_shadow_cliente_id_fkey(
          id,
          name,
          phone,
          email,
          street,
          numero_exterior,
          colonia,
          codigo_postal,
          ciudad,
          estado
        ),
        profiles!orders_shadow_vendedor_id_fkey(
          id,
          full_name,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_name,
        quantity,
        unit_price,
        discount_percentage,
        subtotal,
        odoo_product_id
      `)
      .eq('order_id', orderId)
      .order('product_name')

    if (itemsError) throw itemsError

    // Format response
    const response = {
      order: {
        id: order.id,
        orderNumber: order.order_number,
        createdAt: order.created_at,
        status: order.status,
        invoiceStatus: order.invoice_status,
        invoicePdfUrl: order.invoice_pdf_url,
        subtotal: parseFloat(order.subtotal || 0),
        tax: parseFloat(order.tax || 0),
        total: parseFloat(order.total || 0),
        requestInvoice: order.request_invoice,
        notes: order.notes,
        deliveryInfo: {
          contactName: order.delivery_contact_name,
          phone: order.delivery_phone,
          restaurant: order.delivery_restaurant,
          street: order.delivery_street,
          colonia: order.delivery_colonia,
          codigoPostal: order.delivery_codigo_postal,
          referencias: order.delivery_referencias
        },
        invoiceInfo: order.request_invoice ? {
          rfc: order.invoice_rfc,
          razonSocial: order.invoice_razon_social,
          codigoPostal: order.invoice_codigo_postal_fiscal,
          generatedAt: order.invoice_generated_at
        } : null
      },
      cliente: {
        id: order.clients_mirror?.id,
        name: order.clients_mirror?.name || 'Desconocido',
        phone: order.clients_mirror?.phone,
        email: order.clients_mirror?.email,
        address: {
          street: order.clients_mirror?.street,
          numeroExterior: order.clients_mirror?.numero_exterior,
          colonia: order.clients_mirror?.colonia,
          codigoPostal: order.clients_mirror?.codigo_postal,
          ciudad: order.clients_mirror?.ciudad,
          estado: order.clients_mirror?.estado
        }
      },
      vendedor: {
        id: order.profiles?.id,
        name: order.profiles?.full_name || 'Sin asignar',
        phone: order.profiles?.phone
      },
      items: items?.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: parseFloat(item.quantity || 0),
        unitPrice: parseFloat(item.unit_price || 0),
        discount: parseFloat(item.discount_percentage || 0),
        subtotal: parseFloat(item.subtotal || 0)
      })) || []
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error fetching order detail:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
