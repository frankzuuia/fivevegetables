// =====================================================
// API ENDPOINT: Ticket Promedio Analytics
// Per-vendor metrics: avg ticket, client count, total sales
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
    
    if (!storeId || !dateFrom || !dateTo) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
    }

    // Query: Get all orders in period with vendor info
    const { data: orders, error } = await supabase
      .from('orders_shadow')
      .select(`
        id,
        total,
        vendedor_id,
        cliente_id,
        created_at,
        profiles!orders_shadow_vendedor_id_fkey(
          id,
          full_name
        )
      `)
      .eq('store_id', storeId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .not('status', 'in', '("cancelled","draft")')

    if (error) throw error

    // Process data by vendor
    const vendorStats: any = {}
    
    orders?.forEach(order => {
      const vendorId = order.vendedor_id || 'unassigned'
      const vendorName = order.profiles?.full_name || 'Sin Asignar'
      
      if (!vendorStats[vendorId]) {
        vendorStats[vendorId] = {
          vendorId,
          vendorName,
          totalSales: 0,
          orderCount: 0,
          clientIds: new Set()
        }
      }
      
      vendorStats[vendorId].totalSales += parseFloat(order.total || 0)
      vendorStats[vendorId].orderCount += 1
      if (order.cliente_id) {
        vendorStats[vendorId].clientIds.add(order.cliente_id)
      }
    })

    // Calculate metrics per vendor
    const vendorMetrics = Object.values(vendorStats).map((vendor: any) => ({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      totalSales: vendor.totalSales,
      orderCount: vendor.orderCount,
      clientCount: vendor.clientIds.size,
      avgTicket: vendor.orderCount > 0 ? vendor.totalSales / vendor.orderCount : 0
    }))

    // Sort by total sales descending
    vendorMetrics.sort((a, b) => b.totalSales - a.totalSales)

    // Overall metrics
    const totalRevenue = vendorMetrics.reduce((sum, v) => sum + v.totalSales, 0)
    const totalOrders = vendorMetrics.reduce((sum, v) => sum + v.orderCount, 0)
    const overallAvgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Timeline data for trend chart
    const dailyData = orders?.reduce((acc: any, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, totalRevenue: 0, orderCount: 0 }
      }
      acc[date].totalRevenue += parseFloat(order.total || 0)
      acc[date].orderCount += 1
      return acc
    }, {})

    const timeline = Object.values(dailyData || {}).map((day: any) => ({
      date: day.date,
      avgTicket: day.orderCount > 0 ? day.totalRevenue / day.orderCount : 0,
      orderCount: day.orderCount
    }))

    return NextResponse.json({
      byVendor: vendorMetrics,
      overall: {
        avgTicket: overallAvgTicket,
        totalRevenue,
        totalOrders,
        period: { from: dateFrom, to: dateTo }
      },
      timeline
    })

  } catch (error: any) {
    console.error('Error fetching ticket analytics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
