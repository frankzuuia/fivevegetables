// =====================================================
// SERVER ACTIONS: Products & Price Lists Management
// Complete CRUD with Odoo bidirectional sync
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const UpdateProductPriceSchema = z.object({
  productId: z.string().uuid(),
  odooProductId: z.number(),
  newPrice: z.number().positive(),
})

const CreatePriceListSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['mayorista', 'minorista', 'especial']),
  discountPercentage: z.number().min(0).max(100),
})

const UpdatePriceListSchema = z.object({
  priceListId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['mayorista', 'minorista', 'especial']),
  discountPercentage: z.number().min(0).max(100),
})

const DeletePriceListSchema = z.object({
  priceListId: z.string().uuid(),
})

const AssignPriceListSchema = z.object({
  clientId: z.string().uuid(),
  priceListId: z.string().uuid(),
})

/**
 * Actualizar precio de producto en Odoo
 */
export async function updateProductPrice(input: z.infer<typeof UpdateProductPriceSchema>) {
  try {
    const validated = UpdateProductPriceSchema.parse(input)
    const supabase = await createClient()

    // Verificar que sea gerente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden actualizar precios' }
    }

    // Actualizar en Odoo
    try {
      const { updateProductInOdoo } = await import('@/lib/odoo/client')
      await updateProductInOdoo(validated.odooProductId, {
        list_price: validated.newPrice,
      })
    } catch (odooError) {
      console.error('[Odoo Update Error]', odooError)
      return { success: false, error: 'Error al actualizar en Odoo' }
    }

    // Actualizar en Supabase cache
    const { error: updateError } = await supabase
      .from('products_cache')
      .update({
        base_price: validated.newPrice,
        last_sync: new Date().toISOString(),
      })
      .eq('id', validated.productId)

    if (updateError) {
      console.error('[Supabase Update Error]', updateError)
      return { success: false, error: 'Error al actualizar en Supabase' }
    }

    revalidatePath('/dashboard/gerente')

    return { success: true, message: 'Precio actualizado en Odoo y Supabase' }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('[Update Product Price Error]', error)
    return { success: false, error: 'Error al actualizar precio' }
  }
}

/**
 * Crear lista de precios en Odoo y Supabase
 */
export async function createPriceList(input: z.infer<typeof CreatePriceListSchema>) {
  try {
    const validated = CreatePriceListSchema.parse(input)
    const supabase = await createClient()

    // Verificar que sea gerente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden crear listas' }
    }

    // Crear en Odoo primero
    let odooPricelistId: number
    try {
      const { createPriceListInOdoo } = await import('@/lib/odoo/client')
      odooPricelistId = await createPriceListInOdoo({
        name: validated.name,
        discount_percent: validated.discountPercentage,
      })
    } catch (odooError) {
      console.error('[Odoo Create Pricelist Error]', odooError)
      return { success: false, error: 'Error al crear lista en Odoo' }
    }

    // Crear en Supabase
    const { data: newPriceList, error: insertError } = await supabase
      .from('price_lists')
      .insert({
        store_id: profile.store_id,
        odoo_pricelist_id: odooPricelistId,
        name: validated.name,
        type: validated.type,
        discount_percentage: validated.discountPercentage,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Supabase Insert Error]', insertError)
      return { success: false, error: 'Error al guardar en Supabase' }
    }

    revalidatePath('/dashboard/gerente')

    return {
      success: true,
      message: 'Lista de precios creada exitosamente',
      priceList: newPriceList,
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('[Create PriceList Error]', error)
    return { success: false, error: 'Error al crear lista de precios' }
  }
}

/**
 * Actualizar lista de precios en Odoo y Supabase
 */
export async function updatePriceList(input: z.infer<typeof UpdatePriceListSchema>) {
  try {
    const validated = UpdatePriceListSchema.parse(input)
    const supabase = await createClient()

    // Verificar que sea gerente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden actualizar listas' }
    }

    // Obtener odoo_pricelist_id
    const { data: priceList } = await supabase
      .from('price_lists')
      .select('odoo_pricelist_id')
      .eq('id', validated.priceListId)
      .single()

    if (!priceList) {
      return { success: false, error: 'Lista de precios no encontrada' }
    }

    // Actualizar en Odoo
    try {
      const { updatePriceListInOdoo } = await import('@/lib/odoo/client')
      await updatePriceListInOdoo(priceList.odoo_pricelist_id, {
        name: validated.name,
      })
    } catch (odooError) {
      console.error('[Odoo Update Pricelist Error]', odooError)
      return { success: false, error: 'Error al actualizar en Odoo' }
    }

    // Actualizar en Supabase
    const { error: updateError } = await supabase
      .from('price_lists')
      .update({
        name: validated.name,
        type: validated.type,
        discount_percentage: validated.discountPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.priceListId)

    if (updateError) {
      console.error('[Supabase Update Error]', updateError)
      return { success: false, error: 'Error al actualizar en Supabase' }
    }

    revalidatePath('/dashboard/gerente')

    return { success: true, message: 'Lista de precios actualizada exitosamente' }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('[Update PriceList Error]', error)
    return { success: false, error: 'Error al actualizar lista de precios' }
  }
}

/**
 * Eliminar lista de precios en Odoo y Supabase
 */
export async function deletePriceList(input: z.infer<typeof DeletePriceListSchema>) {
  try {
    const validated = DeletePriceListSchema.parse(input)
    const supabase = await createClient()

    // Verificar que sea gerente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden eliminar listas' }
    }

    // Obtener odoo_pricelist_id
    const { data: priceList } = await supabase
      .from('price_lists')
      .select('odoo_pricelist_id')
      .eq('id', validated.priceListId)
      .single()

    if (!priceList) {
      return { success: false, error: 'Lista de precios no encontrada' }
    }

    // Archivar en Odoo (no eliminar permanentemente)
    try {
      const { deletePriceListInOdoo } = await import('@/lib/odoo/client')
      await deletePriceListInOdoo(priceList.odoo_pricelist_id)
    } catch (odooError) {
      console.error('[Odoo Delete Pricelist Error]', odooError)
      return { success: false, error: 'Error al archivar en Odoo' }
    }

    // Eliminar en Supabase
    const { error: deleteError } = await supabase
      .from('price_lists')
      .delete()
      .eq('id', validated.priceListId)

    if (deleteError) {
      console.error('[Supabase Delete Error]', deleteError)
      return { success: false, error: 'Error al eliminar en Supabase' }
    }

    revalidatePath('/dashboard/gerente')

    return { success: true, message: 'Lista de precios eliminada exitosamente' }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('[Delete PriceList Error]', error)
    return { success: false, error: 'Error al eliminar lista de precios' }
  }
}

/**
 * Asignar lista de precios a cliente
 */
export async function assignPriceListToClient(input: z.infer<typeof AssignPriceListSchema>) {
  try {
    const validated = AssignPriceListSchema.parse(input)
    const supa base = await createClient()

    // Verificar que sea gerente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden asignar listas' }
    }

    // Obtener odoo_partner_id del cliente
    const { data: cliente } = await supabase
      .from('clients_mirror')
      .select('odoo_partner_id, odoo_pricelist_id')
      .eq('id', validated.clientId)
      .single()

    if (!cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    // Obtener odoo_pricelist_id de la lista
    const { data: priceList } = await supabase
      .from('price_lists')
      .select('odoo_pricelist_id')
      .eq('id', validated.priceListId)
      .single()

    if (!priceList) {
      return { success: false, error: 'Lista de precios no encontrada' }
    }

    // Actualizar en Odoo
    try {
      const { updatePartnerInOdoo } = await import('@/lib/odoo/client')
      await updatePartnerInOdoo(cliente.odoo_partner_id, {
        property_product_pricelist: priceList.odoo_pricelist_id,
      })
    } catch (odooError) {
      console.error('[Odoo Update Partner Error]', odooError)
      return { success: false, error: 'Error al actualizar en Odoo' }
    }

    // Actualizar en Supabase
    const { error: updateError } = await supabase
      .from('clients_mirror')
      .update({
        pricelist_id: validated.priceListId,
        odoo_pricelist_id: priceList.odoo_pricelist_id,
      })
      .eq('id', validated.clientId)

    if (updateError) {
      console.error('[Supabase Update Error]', updateError)
      return { success: false, error: 'Error al actualizar en Supabase' }
    }

    revalidatePath('/dashboard/gerente')

    return { success: true, message: 'Lista de precios asignada exitosamente' }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('[Assign PriceList Error]', error)
    return { success: false, error: 'Error al asignar lista de precios' }
  }
}
