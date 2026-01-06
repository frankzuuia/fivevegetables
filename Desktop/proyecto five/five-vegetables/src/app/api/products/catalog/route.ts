// =====================================================
// API ROUTE: Products Catalog (Cliente)
// Productos con precio personalizado según pricelist
// =====================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // AUTH
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // GET CLIENTE DATA (pricelist assignment)
    const { data: cliente } = await supabase
      .from('clients_mirror')
      .select('id, pricelist_id, odoo_pricelist_id, vendedor_id')
      .eq('profile_id', user.id)
      .single()
    
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    
    // Validar cliente tiene vendedor asignado
    if (!cliente.vendedor_id) {
      return NextResponse.json({ 
        error: 'Esperando asignación de vendedor. Contacta al administrador.',
        needsAssignment: true 
      }, { status: 403 })
    }
    
    // GET PRODUCTOS ACTIVOS
    const { data: productos, error: prodError } = await supabase
      .from('products_cache')
      .select('*')
      .eq('active', true)
      .order('name')
    
    if (prodError) throw prodError
    
    if (!productos || productos.length === 0) {
      return NextResponse.json([])
    }
    
    // APLICAR PRECIO PERSONALIZADO
    // Si tiene pricelist_id, intentar obtener reglas de precio
    let preciosPersonalizados: Record<number, number> = {}
    
    if (cliente.pricelist_id) {
      // Query pricelist rules (si existen en Supabase)
      // Por ahora usamos list_price default
      // TODO: Implementar query a pricelist_rules cuando se sincronicen de Odoo
    }
    
    // Mapear productos con precio final
    const productosConPrecio = productos.map((producto: any) => {
      const precioPersonalizado = preciosPersonalizados[producto.odoo_product_id]
      const precioFinal = precioPersonalizado || producto.list_price || 0
      
      return {
        id: producto.id,
        odoo_product_id: producto.odoo_product_id,
        name: producto.name,
        description: producto.description,
        category: producto.category,
        image_url: producto.image_url,
        price: precioFinal,
        stock: producto.stock_level || 0,
        unit: producto.uom || 'pz',
        available: (producto.stock_level || 0) > 0,
      }
    })
    
    return NextResponse.json(productosConPrecio)
    
  } catch (error) {
    console.error('[Products Catalog Error]', error)
    return NextResponse.json(
      { error: 'Error al obtener catálogo' },
      { status: 500 }
    )
  }
}
