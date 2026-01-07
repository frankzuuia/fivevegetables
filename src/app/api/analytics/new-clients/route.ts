// =====================================================
// API ENDPOINT: New Clients Analytics
// Shows clients registered in selected period
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

    // Query: Get clients registered in period
    const { data: clients, error } = await supabase
      .from('clients_mirror')
      .select(`
        id,
        name,
        phone,
        email,
        street,
        numero_exterior,
        colonia,
        codigo_postal,
        ciudad,
        created_at,
        vendedor_id,
        profiles!clients_mirror_vendedor_id_fkey(
          id,
          full_name,
          phone
        )
      `)
      .eq('store_id', storeId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Format response
    const newClients = clients?.map(client => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: {
        street: client.street,
        numeroExterior: client.numero_exterior,
        colonia: client.colonia,
        codigoPostal: client.codigo_postal,
        ciudad: client.ciudad
      },
      registeredAt: client.created_at,
      vendedor: client.vendedor_id ? {
        id: client.profiles?.id,
        name: client.profiles?.full_name || 'Desconocido',
        phone: client.profiles?.phone
      } : null,
      hasVendor: !!client.vendedor_id
    })) || []

    // Stats by vendor
    const vendorStats = newClients.reduce((acc: any, client) => {
      const vendorName = client.vendedor?.name || 'Sin Asignar'
      if (!acc[vendorName]) {
        acc[vendorName] = { vendorName, count: 0 }
      }
      acc[vendorName].count += 1
      return acc
    }, {})

    const byVendor = Object.values(vendorStats)

    return NextResponse.json({
      clients: newClients,
      summary: {
        total: newClients.length,
        withVendor: newClients.filter(c => c.hasVendor).length,
        withoutVendor: newClients.filter(c => !c.hasVendor).length,
        byVendor,
        period: { from: dateFrom, to: dateTo }
      }
    })

  } catch (error: any) {
    console.error('Error fetching new clients:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
