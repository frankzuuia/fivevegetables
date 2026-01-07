// =====================================================
// API ENDPOINT: Revenue Analytics (Ingresos Totales)
// Connects to Supabase orders_shadow for real data
// =====================================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const storeId = searchParams.get('store_id')
    const dateFrom = searchParams.get('from') // ISO date string
    const dateTo = searchParams.get('to') // ISO date string
    
    if (!storeId) {
      return NextResponse.json({ error: 'store_id required' }, { status: 400 })
    }

    // Default to today if no dates provided
    const from = dateFrom || new Date().toISOString().split('T')[0]
    const to = dateTo || new Date().toISOString().split('T')[0]

    // Query 1: Revenue Over Time (daily breakdown)
    const { data: revenueTimeline, error: timelineError } = await supabase.rpc(
      'get_revenue_timeline',
      {
        p_store_id: storeId,
        p_from: from,
        p_to: to
      }
    )

    if (timelineError) {
      // Fallback to direct query if function doesn't exist yet
      const { data: fallbackTimeline, error: fbError } = await supabase
        .from('orders_shadow')
        .select('created_at, total, status')
        .eq('store_id', storeId)
        .gte('created_at', from)
        .lte('created_at', to)
        .not('status', 'in', '("cancelled","draft")')
        .order('created_at', { ascending: true })
      
      if (fbError) throw fbError

      // Process into daily aggregates
      const dailyRevenue = fallbackTimeline.reduce((acc: any, order: any) => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, orderCount: 0 }
        }
        acc[date].revenue += parseFloat(order.total || 0)
        acc[date].orderCount += 1
        return acc
      }, {})

      const timeline = Object.values(dailyRevenue)
      
      return NextResponse.json({ revenueTimeline: timeline })
    }

    // Query 2: Revenue by Vendor
    const { data: revenueByVendor, error: vendorError } = await supabase
      .from('orders_shadow')
      .select(`
        vendedor_id,
        total,
        profiles!orders_shadow_vendedor_id_fkey(full_name)
      `)
      .eq('store_id', storeId)
      .gte('created_at', from)
      .lte('created_at', to)
      .not('status', 'in', '("cancelled","draft")')

    if (vendorError) throw vendorError

    // Aggregate by vendor
    const vendorRevenue = revenueByVendor.reduce((acc: any, order: any) => {
      const vendorName = order.profiles?.full_name || 'Sin Asignar'
      if (!acc[vendorName]) {
        acc[vendorName] = { name: vendorName, revenue: 0, orderCount: 0 }
      }
      acc[vendorName].revenue += parseFloat(order.total || 0)
      acc[vendorName].orderCount += 1
      return acc
    }, {})

    const byVendor = Object.values(vendorRevenue).sort((a: any, b: any) => b.revenue - a.revenue)

    // Query 3: Total Summary
    const { data: summary } = await supabase
      .from('orders_shadow')
      .select('total')
      .eq('store_id', storeId)
      .gte('created_at', from)
      .lte('created_at', to)
      .not('status', 'in', '("cancelled","draft")')

    const totalRevenue = summary?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0
    const orderCount = summary?.length || 0
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

    return NextResponse.json({
      revenueTimeline: revenueTimeline || [],
      revenueByVendor: byVendor,
      summary: {
        total: totalRevenue,
        orderCount,
        avgOrderValue,
        period: { from, to }
      }
    })

  } catch (error: any) {
    console.error('Error fetching revenue analytics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
