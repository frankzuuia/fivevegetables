'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { updatePartnerPricelist } from '@/lib/odoo/client'
import { revalidatePath } from 'next/cache'

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const UpdatePricelistSchema = z.object({
  clienteId: z.string().uuid(),
  newPricelistId: z.string().uuid(),
})

export type UpdatePricelistInput = z.infer<typeof UpdatePricelistSchema>
export type UpdatePricelistResult =
  | { success: true }
  | { success: false; error: string }

// =====================================================
// SERVER ACTION: UPDATE CLIENT PRICELIST
// ⭐ CONTROL REMOTO DE PRECIOS
// =====================================================

export async function updateClientPricelist(
  input: UpdatePricelistInput
): Promise<UpdatePricelistResult> {
  try {
    // 1. VALIDAR INPUT
    const validated = UpdatePricelistSchema.parse(input)

    // 2. AUTENTICACIÓN
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autorizado' }
    }

    // 3. VERIFICAR ROL (Solo vendedor y gerente pueden cambiar precios)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Perfil no encontrado' }
    }

    if (!['vendedor', 'gerente'].includes(profile.role)) {
      return {
        success: false,
        error: 'Solo vendedor o gerente pueden cambiar tarifas',
      }
    }

    // 4. OBTENER CLIENTE CON ODOO IDs
    const { data: cliente, error: clienteError } = await supabase
      .from('clients_mirror')
      .select('id, odoo_partner_id, name, store_id, pricelist_id')
      .eq('id', validated.clienteId)
      .single()

    if (clienteError || !cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    // Verificar que el cliente pertenece al mismo store
    if (cliente.store_id !== profile.store_id) {
      return {
        success: false,
        error: 'Cliente no pertenece a tu tienda',
      }
    }

    // 5. OBTENER NUEVA PRICELIST CON ODOO ID
    const { data: newPricelist, error: pricelistError } = await supabase
      .from('price_lists')
      .select('id, odoo_pricelist_id, name, type, store_id')
      .eq('id', validated.newPricelistId)
      .single()

    if (pricelistError || !newPricelist) {
      return { success: false, error: 'Tarifa no encontrada' }
    }

    // Verificar que la pricelist pertenece al mismo store
    if (newPricelist.store_id !== profile.store_id) {
      return {
        success: false,
        error: 'Tarifa no pertenece a tu tienda',
      }
    }

    // No hacer nada si ya tiene esa tarifa
    if (cliente.pricelist_id === validated.newPricelistId) {
      return { success: true }
    }

    // 6. ⭐ ACTUALIZAR EN ODOO PRIMERO (Source of Truth)
    try {
      await updatePartnerPricelist(
        cliente.odoo_partner_id,
        newPricelist.odoo_pricelist_id
      )

      console.log(
        `[Price Update Success] Cliente "${cliente.name}" → Tarifa "${newPricelist.name}" en Odoo`
      )
    } catch (odooError) {
      console.error('[Odoo Price Update Error]', odooError)
      return {
        success: false,
        error: 'Error al actualizar precio en Odoo: ' +
          (odooError instanceof Error ? odooError.message : 'Error desconocido'),
      }
    }

    // 7. ACTUALIZAR EN SUPABASE (Mirror)
    const { error: updateError } = await supabase
      .from('clients_mirror')
      .update({
        pricelist_id: validated.newPricelistId,
        odoo_pricelist_id: newPricelist.odoo_pricelist_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.clienteId)

    if (updateError) {
      console.error('[Supabase Price Update Error]', updateError)
      // Odoo ya se actualizó, log el error pero reportar éxito
      console.warn(
        `[Warning] Odoo actualizado pero Supabase falló. Sync manual requerido.`
      )
    }

    // 8. REVALIDAR RUTAS PARA CACHE INVALIDATION
    revalidatePath('/dashboard/vendedor')
    revalidatePath('/dashboard/gerente')
    revalidatePath(`/catalog/${validated.clienteId}`)
    revalidatePath('/api/products/list')

    console.log(
      `[Control Remoto Precios] Cliente "${cliente.name}" cambió de tarifa → "${newPricelist.name}"`
    )

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validación: ${firstError.path.join('.')}: ${firstError.message}`,
      }
    }

    console.error('[Update Pricelist Error]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

// =====================================================
// SERVER ACTION: GET PERSONALIZED CATALOG
// Catálogo con precios personalizados según tarifa del cliente
// =====================================================

const GetPersonalizedCatalogSchema = z.object({
  clienteId: z.string().uuid(),
  category: z.string().optional(),
  search: z.string().optional(),
})

export type PersonalizedProduct = {
  id: string
  odooProductId: number
  name: string
  description: string | null
  imageUrl: string | null
  basePrice: number
  personalizedPrice: number
  savingsAmount: number
  savingsPercentage: number
  pricelistType: string
  pricelistName: string
  stockQuantity: number
  category: string | null
  unitOfMeasure: string
}

export async function getPersonalizedCatalog(
  input: z.infer<typeof GetPersonalizedCatalogSchema>
): Promise<PersonalizedProduct[]> {
  try {
    const validated = GetPersonalizedCatalogSchema.parse(input)

    const supabase = await createClient()

    // 1. OBTENER PRICELIST DEL CLIENTE
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
      .eq('id', validated.clienteId)
      .single()

    if (!cliente) {
      throw new Error('Cliente no encontrado')
    }

    const pricelist = cliente.price_lists as unknown as {
      name: string
      type: string
      discount_percentage: number
    }

    // 2. OBTENER PRODUCTOS CON FILTROS
    let query = supabase
      .from('products_cache')
      .select('*')
      .eq('active', true)
      .order('name')

    if (validated.category) {
      query = query.eq('category', validated.category)
    }

    if (validated.search) {
      query = query.ilike('name', `%${validated.search}%`)
    }

    const { data: products } = await query

    if (!products) {
      return []
    }

    // 3. CALCULAR PRECIOS PERSONALIZADOS
    const personalizedProducts: PersonalizedProduct[] = products.map((product) => {
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
        stockQuantity: product.stock_quantity,
        category: product.category,
        unitOfMeasure: product.unit_of_measure,
      }
    })

    return personalizedProducts
  } catch (error) {
    console.error('[Get Personalized Catalog Error]', error)
    throw error
  }
}
