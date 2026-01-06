import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =====================================================
// GET /api/clientes/[id]/stats
// Estadísticas detalladas del cliente (productos más pedidos)
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: clienteId } = await params
    
    // 1. AUTH - Solo gerente puede ver stats clientes
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'gerente') {
      return NextResponse.json({ error: 'Solo gerente' }, { status: 403 })
    }
    
    // 2. Obtener info del cliente
    const { data: cliente } = await supabase
      .from('clients_mirror')
      .select('id, name, email, phone, created_at')
      .eq('id', clienteId)
      .eq('store_id', profile.store_id)
      .single()
    
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    
    // 3. Top productos más pedidos del cliente
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        product_name,
        odoo_product_id,
        quantity,
        unit_price,
        order_id,
        orders_shadow!inner (
          cliente_id,
          status,
          created_at
        )
      `)
      .eq('orders_shadow.cliente_id', clienteId)
      .neq('orders_shadow.status', 'cancelled')
    
    // Agrupar por producto
    const productsMap = new Map<string, {
      productName: string
      odooProductId: number
      totalQuantity: number
      orderCount: number
      lastPrice: number
    }>()
    
    orderItems?.forEach((item: any) => {
      const key = `${item.odoo_product_id}`
      const existing = productsMap.get(key)
      
      if (existing) {
        existing.totalQuantity += item.quantity
        existing.orderCount += 1
        existing.lastPrice = item.unit_price
      } else {
        productsMap.set(key, {
          productName: item.product_name,
          odooProductId: item.odoo_product_id,
          totalQuantity: item.quantity,
          orderCount: 1,
          lastPrice: item.unit_price,
        })
      }
    })
    
    const topProductos = Array.from(productsMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)
    
    // 4. Última compra
    const { data: lastOrder } = await supabase
      .from('orders_shadow')
      .select('order_number, total, created_at')
      .eq('cliente_id', clienteId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // 5. Total pedidos y gasto total
    const { data: allOrders } = await supabase
      .from('orders_shadow')
      .select('total')
      .eq('cliente_id', clienteId)
      .neq('status', 'cancelled')
    
    const totalOrders = allOrders?.length || 0
    const totalSpent = allOrders?.reduce((sum, o) => sum + o.total, 0) || 0
    
    return NextResponse.json({
      cliente: {
        id: cliente.id,
        name: cliente.name,
        email: cliente.email,
        phone: cliente.phone,
        memberSince: cliente.created_at,
      },
      topProductos,
      stats: {
        totalOrders,
        totalSpent: Number(totalSpent.toFixed(2)),
        averageOrderValue: totalOrders > 0 ? Number((totalSpent / totalOrders).toFixed(2)) : 0,
      },
      lastOrder: lastOrder || null,
    })
  } catch (error) {
    console.error('[Cliente Stats Error]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
