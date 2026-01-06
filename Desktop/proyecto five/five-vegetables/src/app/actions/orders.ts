'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createSaleOrder } from '@/lib/odoo/client'

// =====================================================
// Marcar Pedido como Recibido (Cliente)
// =====================================================

const MarcarRecibidoSchema = z.object({
  pedidoId: z.string().uuid(),
})

export async function marcarRecibido(input: z.infer<typeof MarcarRecibidoSchema>) {
  try {
    const validated = MarcarRecibidoSchema.parse(input)
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autorizado' }
    
    const { data: pedido } = await supabase
      .from('orders_shadow')
      .select('*, clients_mirror!inner(profile_id)')
      .eq('id', validated.pedidoId)
      .single()
    
    if (!pedido) return { success: false, error: 'Pedido no encontrado' }
    
    if ((pedido as any).clients_mirror.profile_id !== user.id) {
      return { success: false, error: 'No autorizado' }
    }
    
    if (pedido.status !== 'confirmed') {
      return { success: false, error: 'El pedido debe estar confirmado' }
    }
    
    const { error: updateError } = await supabase
      .from('orders_shadow')
      .update({ 
        status: 'received',
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.pedidoId)
    
    if (updateError) return { success: false, error: updateError.message }
    
    revalidatePath('/dashboard/cliente')
    revalidatePath('/dashboard/vendedor')
    
    return { success: true }
  } catch (error) {
    console.error('[Marcar Recibido]', error)
    return { success: false, error: 'Error interno' }
  }
}

// =====================================================
// Marcar Pedido como Entregado (Vendedor)
// =====================================================

const MarcarEntregadoSchema = z.object({
  pedidoId: z.string().uuid(),
})

export async function marcarEntregado(input: z.infer<typeof MarcarEntregadoSchema>) {
  try {
    const validated = MarcarEntregadoSchema.parse(input)
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autorizado' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'vendedor'  && profile.role !== 'gerente')) {
      return { success: false, error: 'Solo vendedores y gerentes' }
    }
    
    const { data: pedido } = await supabase
      .from('orders_shadow')
      .select('*')
      .eq('id', validated.pedidoId)
      .single()
    
    if (!pedido) return { success: false, error: 'Pedido no encontrado' }
    
    if (profile.role === 'vendedor' && pedido.vendedor_id !== user.id) {
      return { success: false, error: 'No autorizado' }
    }
    
    if (pedido.status !== 'received') {
      return { success: false, error: 'Debe estar recibido por cliente' }
    }
    
    const { error: updateError } = await supabase
      .from('orders_shadow')
      .update({ 
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.pedidoId)
    
    if (updateError) return { success: false, error: updateError.message }
    
    revalidatePath('/dashboard/cliente')
    revalidatePath('/dashboard/vendedor')
    
    return { success: true }
  } catch (error) {
    console.error('[Marcar Entregado]', error)
    return { success: false, error: 'Error interno' }
  }
}

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================


const CreateOrderItemSchema = z.object({
  productId: z.string().uuid(),
  odooProductId: z.number().int().positive(),
  productName: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  discountPercentage: z.number().min(0).max(100).default(0),
})

const DeliveryDataSchema = z.object({
  contactName: z.string().min(1),
  phone: z.string().regex(/^\d{10}$/),
  restaurant: z.string().min(1),
  street: z.string().min(1),
  colonia: z.string().min(1),
  codigoPostal: z.string().regex(/^\d{5}$/),
  referencias: z.string().optional(),
})

const CreateOrderSchema = z.object({
  clienteId: z.string().uuid(),
  items: z.array(CreateOrderItemSchema).min(1, 'Al menos un producto requerido'),
  deliveryData: DeliveryDataSchema,
  requestInvoice: z.boolean().default(false),
  notes: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type CreateOrderResult = 
  | { success: true; orderId: string; orderNumber: string }
  | { success: false; error: string }

// =====================================================
// SERVER ACTION: CREATE ORDER
// =====================================================

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    // 1. VALIDAR INPUT CON ZOD
    const validated = CreateOrderSchema.parse(input)

    // 2. AUTENTICACIÓN
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'No autorizado' }
    }

    // 3. OBTENER PERFIL Y VERIFICAR ROL
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Perfil no encontrado' }
    }

    // Solo vendedor y cliente pueden crear pedidos
    if (!['vendedor', 'cliente'].includes(profile.role)) {
      return { success: false, error: 'Rol no autorizado para crear pedidos' }
    }

    // 4. OBTENER CLIENTE Y VERIFICAR ACCESO (RLS)
    const { data: cliente } = await supabase
      .from('clients_mirror')
      .select('id, odoo_partner_id, name, store_id')
      .eq('id', validated.clienteId)
      .single()

    if (!cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    // Verificar que el cliente pertenece al mismo store
    if (cliente.store_id !== profile.store_id) {
      return { success: false, error: 'Cliente no pertenece a tu tienda' }
    }

    // 5. CALCULAR TOTALES
    let subtotal = 0
    const itemsWithSubtotals = validated.items.map((item) => {
      const discount = item.unitPrice * (item.discountPercentage / 100)
      const priceAfterDiscount = item.unitPrice - discount
      const itemSubtotal = priceAfterDiscount * item.quantity

      subtotal += itemSubtotal

      return {
        ...item,
        subtotal: itemSubtotal,
      }
    })

    const tax = subtotal * 0.16 // IVA 16% México
    const total = subtotal + tax

    // 6. GENERAR NÚMERO DE PEDIDO
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // 7. CREAR PEDIDO EN SUPABASE (orders_shadow)
    const { data: order, error: orderError } = await supabase
      .from('orders_shadow')
      .insert({
        store_id: profile.store_id,
        cliente_id: validated.clienteId,
        vendedor_id: profile.role === 'vendedor' ? user.id : null,
        order_number: orderNumber,
        status: 'draft',
        invoice_status: validated.requestInvoice ? 'to_invoice' : 'no',
        request_invoice: validated.requestInvoice,
        subtotal,
        tax,
        total,
        notes: validated.notes || null,
        // Snapshot delivery data
        delivery_contact_name: validated.deliveryData.contactName,
        delivery_phone: validated.deliveryData.phone,
        delivery_restaurant: validated.deliveryData.restaurant,
        delivery_street: validated.deliveryData.street,
        delivery_colonia: validated.deliveryData.colonia,
        delivery_codigo_postal: validated.deliveryData.codigoPostal,
        delivery_referencias: validated.deliveryData.referencias || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('[Order Creation Error]', orderError)
      return { success: false, error: 'Error al crear pedido en base de datos' }
    }

    // 8. CREAR ITEMS DEL PEDIDO (order_items)
    const orderItemsToInsert = itemsWithSubtotals.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      odoo_product_id: item.odooProductId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_percentage: item.discountPercentage,
      subtotal: item.subtotal,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)

    if (itemsError) {
      console.error('[Order Items Error]', itemsError)
      // Rollback: eliminar order
      await supabase.from('orders_shadow').delete().eq('id', order.id)
      return { success: false, error: 'Error al crear items del pedido' }
    }

    // 9. SINCRONIZAR CON ODOO (ASYNC - NO BLOQUEAR)
    // Esto se ejecuta en background, si falla se loguea pero NO falla el pedido
    try {
      const odooOrderLine = validated.items.map((item) => ({
        product_id: item.odooProductId,
        product_uom_qty: item.quantity,
        price_unit: item.unitPrice,
      }))

      const odooOrderId = await createSaleOrder({
        partner_id: cliente.odoo_partner_id,
        order_line: odooOrderLine,
        note: validated.notes || `Pedido desde App: ${orderNumber}`,
      })

      // Actualizar order con odoo_order_id
      await supabase
        .from('orders_shadow')
        .update({
          odoo_order_id: odooOrderId,
          synced_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      console.log(`[Order Sync Success] Order ${orderNumber} synced to Odoo ID: ${odooOrderId}`)
    } catch (odooError) {
      // Log error pero NO fallar el pedido
      // El cron job de sync lo reintentará después
      console.error('[Order Odoo Sync Error]', odooError)
      console.log(`[Order] ${orderNumber} creado en Supabase, sync a Odoo pendiente`)
    }

    // 10. REVALIDAR RUTAS PARA REFETCH
    revalidatePath('/dashboard/vendedor')
    revalidatePath('/dashboard/cliente')
    revalidatePath(`/orders/${order.id}`)

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validación: ${firstError.path.join('.')}: ${firstError.message}`,
      }
    }

    console.error('[Create Order Error]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
