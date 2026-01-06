import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getDateRange } from '@/lib/utils/date-ranges'

// =====================================================
// GET /api/metrics/gerente
// Métricas para dashboard del gerente
// =====================================================

const QuerySchema = z.object({
  store_id: z.string().uuid(),
  filter: z.enum(['today', 'yesterday', 'week', 'month', 'year']),
})

export async function GET(request: NextRequest) {
  try {
    // 1. AUTENTICACIÓN
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. VERIFICAR ROL (Solo gerente)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'gerente') {
      return NextResponse.json(
        { error: 'Acceso denegado: Solo gerente' },
        { status: 403 }
      )
    }

    // 3. VALIDAR QUERY PARAMS
    const searchParams = request.nextUrl.searchParams
    const validated = QuerySchema.parse({
      store_id: searchParams.get('store_id'),
      filter: searchParams.get('filter'),
    })

    // Verificar que el store_id pertenece al gerente
    if (validated.store_id !== profile.store_id) {
      return NextResponse.json(
        { error: 'No puedes ver métricas de otra tienda' },
        { status: 403 }
      )
    }

    // 4. CALCULAR RANGO DE FECHAS
    const { startDate, endDate } = getDateRange(validated.filter)

    // 5. TOP 5 CLIENTES (más compras $)
    const { data: ordersData } = await supabase
      .from('orders_shadow')
      .select(`
        cliente_id,
        total,
        clients_mirror!inner (
          id,
          name,
          email
        )
      `)
      .eq('store_id', validated.store_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .neq('status', 'cancelled')

    // Agrupar por cliente y sumar totales
    const clientStats = new Map<string, {
      id: string
      name: string
      email: string | null
      totalSpent: number
      orderCount: number
    }>()

    ordersData?.forEach((order) => {
      const client = order.clients_mirror as unknown as {
        id: string
        name: string
        email: string | null
      }
      
      const existing = clientStats.get(client.id)
      if (existing) {
        existing.totalSpent += order.total
        existing.orderCount += 1
      } else {
        clientStats.set(client.id, {
          id: client.id,
          name: client.name,
          email: client.email,
          totalSpent: order.total,
          orderCount: 1,
        })
      }
    })

    const topClients = Array.from(clientStats.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    // 6. TOP 5 VENDEDORES (más ventas $)
    const { data: vendedorOrders } = await supabase
      .from('orders_shadow')
      .select(`
        vendedor_id,
        total,
        profiles!inner (
          id,
          full_name
        )
      `)
      .eq('store_id', validated.store_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('vendedor_id', 'is', null)
      .neq('status', 'cancelled')

    // Agrupar por vendedor
    const vendedorStats = new Map<string, {
      id: string
      name: string
      salesTotal: number
      orderCount: number
    }>()

    vendedorOrders?.forEach((order) => {
      if (!order.vendedor_id) return

      const vendedor = order.profiles as unknown as {
        id: string
        full_name: string
      }

      const existing = vendedorStats.get(order.vendedor_id)
      if (existing) {
        existing.salesTotal += order.total
        existing.orderCount += 1
      } else {
        vendedorStats.set(order.vendedor_id, {
          id: order.vendedor_id,
          name: vendedor.full_name || 'Sin nombre',
          salesTotal: order.total,
          orderCount: 1,
        })
      }
    })

    const topVendedores = Array.from(vendedorStats.values())
      .sort((a, b) => b.salesTotal - a.salesTotal)
      .slice(0, 5)

    // 7. METRICAS GENERALES
    const { data: allOrders } = await supabase
      .from('orders_shadow')
      .select('total, status')
      .eq('store_id', validated.store_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const validOrders = allOrders?.filter((o) => o.status !== 'cancelled') || []
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0)
    const totalOrders = validOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // 8. CONTAR CLIENTES ÚNICOS
    const uniqueClients = new Set(ordersData?.map((o) => o.cliente_id)).size

    return NextResponse.json({
      topClients,
      topVendedores,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      uniqueClients,
      filter: validated.filter,
      dateRange: { startDate, endDate },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('[Metrics Gerente Error]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
