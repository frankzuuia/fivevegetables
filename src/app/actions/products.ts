// =====================================================
// SERVER ACTIONS: Products & Price Lists Management
// Complete CRUD with Odoo bidirectional sync
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// SCHEMAS
// =====================================================

const UpdateProductPriceSchema = z.object({
  productId: z.string().uuid(),
  odooProductId: z.number(),
  newPrice: z.number().positive(),
  uomId: z.number().optional(), // ID of uom.uom in Odoo
})

const ToggleProductActiveSchema = z.object({
  productId: z.string().uuid(),
  odooProductId: z.number(),
  active: z.boolean(),
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
 * Actualizar precio (y opcionalmente unidad) de producto en Odoo
 * Docs: uom_id debe ser el ID de uom.uom en Odoo
 */
export async function updateProductPrice(input: z.infer<typeof UpdateProductPriceSchema>) {
  try {
    const validated = UpdateProductPriceSchema.parse(input)
    const supabase = await createClient()

    console.log('[updateProductPrice] Starting update:', validated)

    // Actualizar en Odoo
    try {
      const { updateProductInOdoo } = await import('@/lib/odoo/client')
      const odooValues: Record<string, any> = {
        list_price: validated.newPrice,
      }

      // Si se proporciona uom_id, actualizar también la unidad
      if (validated.uomId) {
        odooValues.uom_id = validated.uomId
      }

      await updateProductInOdoo(validated.odooProductId, odooValues)
      console.log('[updateProductPrice] Odoo updated successfully')
    } catch (odooError) {
      console.error('[Odoo Update Error]', odooError)
      return { success: false, error: 'Error al actualizar en Odoo' }
    }

    // Actualizar en Supabase cache
    const updateData: any = {
      list_price: validated.newPrice,
      last_sync: new Date().toISOString(),
    }

    // Si se cambió la UoM, obtener el nombre desde Odoo y actualizar
    if (validated.uomId) {
      try {
        const { getUnitsOfMeasureFromOdoo } = await import('@/lib/odoo/client')
        const uoms = await getUnitsOfMeasureFromOdoo()
        const selectedUom = uoms.find(u => u.id === validated.uomId)
        if (selectedUom) {
          updateData.uom = selectedUom.name
          console.log(`[updateProductPrice] UoM updated to: ${selectedUom.name}`)
        }
      } catch (uomError) {
        console.error('[Get UoM Error]', uomError)
        // Continue even if UoM fetch fails
      }
    }

    const { error: updateError } = await supabase
      .from('products_cache')
      .update(updateData)
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
 * Activar/Desactivar producto
 * Docs: Cambiar campo 'active' en product.template
 */
export async function toggleProductActive(input: z.infer<typeof ToggleProductActiveSchema>) {
  try {
    const validated = ToggleProductActiveSchema.parse(input)
    const supabase = await createClient()

    console.log('[toggleProductActive] Toggling:', validated)

    // Actualizar en Odoo
    try {
      const { updateProductInOdoo } = await import('@/lib/odoo/client')
      await updateProductInOdoo(validated.odooProductId, {
        active: validated.active,
      })
      console.log(`[toggleProductActive] Odoo updated: active=${validated.active}`)
    } catch (odooError) {
      console.error('[Odoo Toggle Active Error]', odooError)
      return { success: false, error: 'Error al actualizar en Odoo' }
    }

    // Actualizar en Supabase
    const { error: updateError } = await supabase
      .from('products_cache')
      .update({
        active: validated.active,
        last_sync: new Date().toISOString(),
      })
      .eq('id', validated.productId)

    if (updateError) {
      console.error('[Supabase Toggle Active Error]', updateError)
      return { success: false, error: 'Error al actualizar en Supabase' }
    }

    revalidatePath('/dashboard/gerente')
    revalidatePath('/dashboard/vendedor')

    const message = validated.active ? 'Producto activado' : 'Producto desactivado'
    return { success: true, message }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('[Toggle Product Active Error]', error)
    return { success: false, error: 'Error al cambiar estado del producto' }
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
 * Actualizar lista de precios
 * Docs: Usar write en product.pricelist para actualizar nombre
 */
export async function updatePriceList(input: z.infer<typeof UpdatePriceListSchema>) {
  try {
    const validated = UpdatePriceListSchema.parse(input)
    const supabase = await createClient()

    console.log('[updatePriceList] Starting update:', validated)

    // Get odoo_pricelist_id
    const { data: priceList } = await supabase
      .from('price_lists')
      .select('odoo_pricelist_id')
      .eq('id', validated.priceListId)
      .single()

    if (!priceList) {
      return { success: false, error: 'Lista no encontrada' }
    }

    // Actualizar en Odoo si tiene odoo_pricelist_id
    if (priceList.odoo_pricelist_id) {
      try {
        const { updatePriceListInOdoo } = await import('@/lib/odoo/client')
        await updatePriceListInOdoo(priceList.odoo_pricelist_id, {
          name: validated.name,
        })
        console.log('[updatePriceList] Odoo updated successfully')

        // Read back from Odoo to ensure sync
        const { objectClient, authenticateOdoo, ODOO_DB, ODOO_API_KEY } = await import('@/lib/odoo/client')
        const uid = await authenticateOdoo()

        const odooData: any = await new Promise((resolve, reject) => {
          objectClient.methodCall(
            'execute_kw',
            [
              ODOO_DB,
              uid,
              ODOO_API_KEY,
              'product.pricelist',
              'read',
              [[priceList.odoo_pricelist_id]],
              { fields: ['name', 'active'] }
            ],
            (error: any, result: any) => {
              if (error) reject(error)
              else resolve(result[0])
            }
          )
        })

        // Update Supabase with Odoo data to ensure sync
        await supabase
          .from('price_lists')
          .update({
            name: odooData.name,
            active: odooData.active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', validated.priceListId)

        console.log('[updatePriceList] Synced back from Odoo:', odooData.name)

      } catch (odooError) {
        console.error('[Odoo Update Pricelist Error]', odooError)
        return { success: false, error: 'Error al actualizar en Odoo' }
      }
    } else {
      // Si no tiene odoo_pricelist_id, solo actualizar en Supabase
      await supabase
        .from('price_lists')
        .update({
          name: validated.name,
          type: validated.type,
          discount_percentage: validated.discountPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.priceListId)
    }

    revalidatePath('/dashboard/gerente')

    return {
      success: true,
      message: 'Lista de precios actualizada y sincronizada',
    }

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
    if (priceList.odoo_pricelist_id) {
      try {
        const { archivePriceListInOdoo } = await import('@/lib/odoo/client')
        await archivePriceListInOdoo(priceList.odoo_pricelist_id)
      } catch (odooError) {
        console.error('[Odoo Archive Pricelist Error]', odooError)
        // Continue even if Odoo fails
      }
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
