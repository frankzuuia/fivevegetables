import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// =====================================================
// GET /api/products/list
// Catálogo de productos con precios personalizados
// =====================================================

const QuerySchema = z.object({
  cliente_id: z.string().uuid().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  active_only: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 2. VALIDAR QUERY PARAMS
    const searchParams = request.nextUrl.searchParams
    const validated = QuerySchema.parse({
      cliente_id: searchParams.get('cliente_id'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      active_only: searchParams.get('active_only') || 'true',
    })

    // Use default store for now (can be made dynamic later)
    const storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

    let query = supabase
      .from('products_cache')
      .select('*')
      .eq('store_id', storeId)
      .order('name')

    // Filtro por categoría
    if (validated.category) {
      query = query.eq('category', validated.category)
    }

    // Búsqueda por nombre
    if (validated.search) {
      query = query.ilike('name', `%${validated.search}%`)
    }

    // Solo productos activos
    if (validated.active_only) {
      query = query.eq('active', true)
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error('[Products List Error]', productsError)
      console.error('[Products List] storeId:', storeId)
      console.error('[Products List] Query params:', validated)
      return NextResponse.json(
        { error: 'Error al obtener productos', details: productsError.message },
        { status: 400 }
      )
    }

    // 3. SI HAY cliente_id, CALCULAR PRECIOS PERSONALIZADOS
    if (validated.cliente_id) {
      // Obtener pricelist del cliente
      const { data: cliente } = await supabase
        .from('clients_mirror')
        .select(`
          id,
          pricelist_id,
          price_lists!inner (
            name,
            type,
            discount_percentage
          )
        `)
        .eq('id', validated.cliente_id)
        .single()

      if (cliente) {
        const pricelist = cliente.price_lists as unknown as {
          name: string
          type: string
          discount_percentage: number
        }

        // Calcular precios personalizados
        const personalizedProducts = products?.map((product) => {
          const discount = pricelist.discount_percentage / 100
          const personalizedPrice = product.list_price * (1 - discount)
          const savingsAmount = product.list_price - personalizedPrice
          const savingsPercentage = (savingsAmount / product.list_price) * 100

          return {
            id: product.id,
            odooProductId: product.odoo_product_id,
            name: product.name,
            description: product.description,
            imageUrl: product.image_url,
            basePrice: product.list_price,
            personalizedPrice: Number(personalizedPrice.toFixed(2)),
            savingsAmount: Number(savingsAmount.toFixed(2)),
            savingsPercentage: Number(savingsPercentage.toFixed(2)),
            pricelistType: pricelist.type,
            pricelistName: pricelist.name,
            stockQuantity: product.stock_level,
            category: product.category,
            unitOfMeasure: product.uom,
            active: product.active,
          }
        })

        return NextResponse.json({
          products: personalizedProducts,
          hasPersonalizedPricing: true,
          pricelist: {
            name: pricelist.name,
            type: pricelist.type,
            discountPercentage: pricelist.discount_percentage,
          },
        })
      }
    }

    // 4. SI NO HAY cliente_id, RETORNAR PRECIOS BASE
    const baseProducts = products?.map((product) => ({
      id: product.id,
      odooProductId: product.odoo_product_id,
      name: product.name,
      description: product.description,
      imageUrl: product.image_url,
      basePrice: product.list_price,
      stockQuantity: product.stock_level,
      category: product.category,
      unitOfMeasure: product.uom,
      active: product.active,
    }))

    return NextResponse.json({
      products: baseProducts,
      hasPersonalizedPricing: false,
    })
  } catch (error: any) {
    console.error('[Products List] Caught error:', error)
    console.error('[Products List] Error type:', error.constructor.name)
    console.error('[Products List] Error message:', error.message)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
