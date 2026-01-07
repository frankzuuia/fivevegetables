// =====================================================
// API ENDPOINT: Orders List with Filters
// Real-time connection to Supabase orders_shadow
// =====================================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const storeId = searchParams.get('store_id')
    const dateFrom = searchParams.get('from')
    const dateTo = searchParams.get('to')
    const sortBy = searchParams.get('sort_by') || 'date' // 'date' or 'amount'
    const sortOrder = searchParams.get('sort_order') || 'desc' // 'asc' or 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')
    
    if (!storeId || !dateFrom || !dateTo) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
    }

    const offset = (page - 1) * pageSize

    // Build base query
    let query = supabase
      .from('orders_shadow')
      .select(`
        id,
        order_number,
        created_at,
        total,
        subtotal,
        tax,
        status,
        invoice_status,
        request_invoice,
        notes,
        cliente_id,
        vendedor_id,
        clients_mirror!orders_shadow_cliente_id_fkey(
          id,
          name,
          phone,
          email
        ),
        profiles!orders_shadow_vendedor_id_fkey(
          id,
          full_name
        )
      `, { count: 'exact' })
      .eq('store_id', storeId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)

    // Apply sorting
    if (sortBy === 'amount') {
      query = query.order('total', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data: orders, error, count } = await query

    if (error) throw error

    // Format response
    const formattedOrders = orders?.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      date: order.created_at,
      total: parseFloat(order.total || 0),
      subtotal: parseFloat(order.subtotal || 0),
      tax: parseFloat(order.tax || 0),
      status: order.status,
      invoiceStatus: order.invoice_status,
      requestInvoice: order.request_invoice,
      notes: order.notes,
      cliente: {
        id: order.clients_mirror?.id,
        name: order.clients_mirror?.name || 'Desconocido',
        phone: order.clients_mirror?.phone,
        email: order.clients_mirror?.email
      },
      vendedor: {
        id: order.profiles?.id,
        name: order.profiles?.full_name || 'Sin asignar'
      }
    })) || []

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
