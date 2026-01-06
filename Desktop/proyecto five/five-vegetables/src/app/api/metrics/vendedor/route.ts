import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getDateRange } from '@/lib/utils/date-ranges'

// =====================================================
// GET /api/metrics/vendedor
// Métricas para dashboard del vendedor (RLS ISOLATED)
// =====================================================

const QuerySchema = z.object({
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

    // 2. VERIFICAR ROL (Solo vendedor)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'vendedor') {
      return NextResponse.json(
        { error: 'Acceso denegado: Solo vendedor' },
        { status: 403 }
      )
    }

    // 3. VALIDAR QUERY PARAMS
    const searchParams = request.nextUrl.searchParams
    const validated = QuerySchema.parse({
      filter: searchParams.get('filter'),
    })

    // 4. CALCULAR RANGO DE FECHAS
    const { startDate, endDate } = getDateRange(validated.filter)

    // 5. MIS VENTAS (RLS automático: solo pedidos donde vendedor_id = user.id)
    const { data: myOrders } = await supabase
      .from('orders_shadow')
      .select('total, status, cliente_id')
      .eq('vendedor_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const validOrders = myOrders?.filter((o) => o.status !== 'cancelled') || []
    const mySales = validOrders.reduce((sum, o) => sum + o.total, 0)
    const myOrdersCount = validOrders.length

    // 6. MI CLIENTE ESTRELLA (el que más compró)
    const clientPurchases = new Map<string, number>()

    validOrders.forEach((order) => {
      const existing = clientPurchases.get(order.cliente_id)
      clientPurchases.set(
        order.cliente_id,
        (existing || 0) + order.total
      )
    })

    let topClient: {
      id: string
      name: string
      email: string | null
      totalSpent: number
    } | null = null

    if (clientPurchases.size > 0) {
      const topClientId = Array.from(clientPurchases.entries())
        .sort((a, b) => b[1] - a[1])[0][0]

      const { data: clientData } = await supabase
        .from('clients_mirror')
        .select('id, name, email')
        .eq('id', topClientId)
        .single()

      if (clientData) {
        topClient = {
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          totalSpent: clientPurchases.get(topClientId)!,
        }
      }
    }

    // 7. CONTAR MIS CLIENTES ASIGNADOS
    const { data: assignedClients } = await supabase
      .from('vendedor_clientes')
      .select('cliente_id')
      .eq('vendedor_id', user.id)

    const myClientCount = assignedClients?.length || 0

    // 8. CALCULAR TENDENCIA (comparar con período anterior)
    let trend: { value: number; isPositive: boolean } | null = null

    // Calcular rango anterior (mismo tamaño que el actual)
    const rangeDuration = new Date(endDate).getTime() - new Date(startDate).getTime()
    const previousStart = new Date(new Date(startDate).getTime() - rangeDuration).toISOString()
    const previousEnd = startDate

    const { data: previousOrders } = await supabase
      .from('orders_shadow')
      .select('total, status')
      .eq('vendedor_id', user.id)
      .gte('created_at', previousStart)
      .lt('created_at', previousEnd)

    const validPreviousOrders = previousOrders?.filter(
      (o) => o.status !== 'cancelled'
    ) || []
    const previousSales = validPreviousOrders.reduce((sum, o) => sum + o.total, 0)

    if (previousSales > 0) {
      const percentageChange = ((mySales - previousSales) / previousSales) * 100
      trend = {
        value: Number(Math.abs(percentageChange).toFixed(2)),
        isPositive: percentageChange >= 0,
      }
    }

    return NextResponse.json({
      mySales: Number(mySales.toFixed(2)),
      myOrders: myOrdersCount,
      myClientCount,
      topClient,
      trend,
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

    console.error('[Metrics Vendedor Error]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
