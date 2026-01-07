// =====================================================
// SERVER ACTIONS: Gestión de Clientes
// Asignación vendedor + tarifa, reasignación (gerente)
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { updatePartnerPricelist } from '@/lib/odoo/client'
import { revalidatePath } from 'next/cache'

// =====================================================
// Asignar Vendedor + Tarifa a Cliente
// (Solo gerente)
// =====================================================

const AsignarVendedorSchema = z.object({
  clienteId: z.string().uuid(),
  vendedorId: z.string().uuid(),
  pricelistId: z.string().uuid(),
})

export async function asignarVendedor(input: z.infer<typeof AsignarVendedorSchema>) {
  try {
    // 1. VALIDAR INPUT
    const validated = AsignarVendedorSchema.parse(input)
    
    const supabase = await createClient()
    
    // 2. AUTH
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'No autorizado' }
    }
    
    // 3. ROLE CHECK (solo gerente)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden asignar vendedores' }
    }
    
    // 4. FETCH CLIENTE + PRICELIST
    const { data: cliente } = await supabase
      .from('clients_mirror')
      .select('*')
      .eq('id', validated.clienteId)
      .eq('store_id', profile.store_id) // Store isolation
      .single()
    
    if (!cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }
    
    const { data: pricelist } = await supabase
      .from('price_lists')
      .select('*')
      .eq('id', validated.pricelistId)
      .eq('store_id', profile.store_id)
      .single()
    
    if (!pricelist) {
      return { success: false, error: 'Tarifa no encontrada' }
    }
    
    // 5. UPDATE SUPABASE clients_mirror
    const { error: updateError } = await supabase
      .from('clients_mirror')
      .update({
        vendedor_id: validated.vendedorId,
        pricelist_id: validated.pricelistId,
        odoo_pricelist_id: pricelist.odoo_pricelist_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.clienteId)
    
    if (updateError) {
      console.error('[Asignar Vendedor Error]', updateError)
      return { success: false, error: updateError.message }
    }
    
    // 6. INSERT EN vendedor_clientes (si no existe)
    // Check si ya existe relación
    const { data: existingRelation } = await supabase
      .from('vendedor_clientes')
      .select('*')
      .eq('vendedor_id', validated.vendedorId)
      .eq('cliente_id', validated.clienteId)
      .single()
    
    if (!existingRelation) {
      await supabase.from('vendedor_clientes').insert({
        vendedor_id: validated.vendedorId,
        cliente_id: validated.clienteId,
      })
    }
    
    // 7. UPDATE ODOO (asignar pricelist al partner)
    try {
      await updatePartnerPricelist(
        cliente.odoo_partner_id,
        pricelist.odoo_pricelist_id
      )
      console.log(`[Odoo] Pricelist actualizado para partner ${cliente.odoo_partner_id}`)
    } catch (odooError) {
      console.error('[Odoo Update Pricelist Error]', odooError)
      // NO fallar la asignación si Odoo falla, ya que Supabase se actualizó
      console.warn('[Warning] Vendedor asignado en Supabase pero fallo en sync Odoo')
    }
    
    // 8. REVALIDAR RUTAS
    revalidatePath('/dashboard/gerente')
    revalidatePath('/dashboard/vendedor')
    revalidatePath('/api/clientes/sin-asignar')
    
    return { success: true }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validación: ${firstError.path.join('.')}: ${firstError.message}`,
      }
    }
    
    console.error('[Asignar Vendedor Error]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    }
  }
}

// =====================================================
// Reasignar Cliente a Otro Vendedor
// (Solo gerente - usa la misma función asignarVendedor)
// =====================================================

// La función asignarVendedor() maneja tanto asignación como reasignación
// No se necesita función aparte

// =====================================================
// Crear Cliente (Vendedor/Gerente)
// Vendedor crea cliente ya asignado a él
// =====================================================

const CrearClienteSchema = z.object({
  // Datos básicos
  nombre: z.string().min(1, 'Nombre requerido'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Negocio
  nombreRestaurant: z.string().min(1, 'Nombre del restaurant requerido'),
  
  // Dirección entrega
  calle: z.string().min(1, 'Calle requerida'),
  numeroExterior: z.string().min(1, 'Número exterior requerido'),
  numeroInterior: z.string().optional(),
  colonia: z.string().min(1, 'Colonia requerida'),
  entreCalles: z.string().min(1, 'Entre calles requerido'),
  codigoPostal: z.string().regex(/^\d{5}$/, 'CP debe tener 5 dígitos'),
  ciudad: z.string().default('Guadalajara'),
  estado: z.string().default('Jalisco'),
  referencias: z.string().optional(),
  
  // Comercial
  pricelistId: z.string().uuid('Tarifa inválida'),
  requiereFactura: z.boolean().default(false),
})

export async function crearClienteVendedor(
  input: z.infer<typeof CrearClienteSchema>
) {
  try {
    const validated = CrearClienteSchema.parse(input)
    const supabase = await createClient()
    
    // AUTH
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autorizado' }
    
    // ROLE CHECK (vendedor o gerente)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()
    
    if (!profile || (profile.role !== 'vendedor' && profile.role !== 'gerente')) {
      return { success: false, error: 'Solo vendedores y gerentes pueden crear clientes' }
    }
    
    // FETCH PRICELIST
    const { data: pricelist } = await supabase
      .from('price_lists')
      .select('*')
      .eq('id', validated.pricelistId)
      .eq('store_id', profile.store_id)
      .single()
    
    if (!pricelist) return { success: false, error: 'Tarifa no encontrada' }
    
    // GENERAR PIN si no tiene email
    const hasEmail = validated.email && validated.email.length > 0
    const loginMethod = hasEmail ? 'email' : 'phone'
    const pin = !hasEmail ? String(Math.floor(1000 + Math.random() * 9000)) : null
    
    // CREAR EN ODOO
    const { createPartnerInOdoo } = await import('@/lib/odoo/client')
    const odooPartnerId = await createPartnerInOdoo({
      name: validated.nombreRestaurant,
      email: validated.email || '',
      phone: validated.telefono,
      street: `${validated.calle} ${validated.numeroExterior}`,
      city: validated.ciudad,
      zip: validated.codigoPostal,
    })
    
    // CREAR EN clients_mirror
    const { data: cliente, error: clienteError } = await supabase
      .from('clients_mirror')
      .insert({
        store_id: profile.store_id,
        vendedor_id: user.id,
        odoo_partner_id: odooPartnerId,
        name: validated.nombre,
        email: validated.email || null,
        phone: validated.telefono,
        pricelist_id: validated.pricelistId,
        odoo_pricelist_id: pricelist.odoo_pricelist_id,
        street: validated.calle,
        numero_exterior: validated.numeroExterior,
        numero_interior: validated.numeroInterior || null,
        colonia: validated.colonia,
        entre_calles: validated.entreCalles,
        codigo_postal: validated.codigoPostal,
        ciudad: validated.ciudad,
        estado: validated.estado,
        referencias: validated.referencias || null,
        login_method: loginMethod,
        login_pin: pin,
        pin_sent: false,
        requiere_factura_default: validated.requiereFactura,
      })
      .select()
      .single()
    
    if (clienteError) return { success: false, error: clienteError.message }
    
    // INSERT vendedor_clientes
    await supabase.from('vendedor_clientes').insert({
      vendedor_id: user.id,
      cliente_id: cliente.id,
    })
    
    revalidatePath('/dashboard/vendedor')
    revalidatePath('/dashboard/gerente')
    
    return {
      success: true,
      clienteId: cliente.id,
      message: hasEmail
        ? `Cliente creado. Recibirá credenciales en ${validated.email}`
        : 'Cliente creado. Solicita el PIN al gerente.',
      needsPin: !hasEmail,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validación: ${error.issues[0].message}` }
    }
    console.error('[Crear Cliente Error]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error' }
  }
}

// =====================================================
// Eliminar Cliente (Solo Gerente)
// Elimina de Supabase y archiva en Odoo
// =====================================================

export async function deleteCliente(clienteId: string) {
  try {
    const supabase = await createClient()

    // 1. AUTH & ROLE CHECK
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autorizado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden eliminar clientes' }
    }

    // 2. OBTENER CLIENTE PARA ODOO ID
    const { data: cliente, error: fetchError } = await supabase
      .from('clients_mirror')
      .select('odoo_partner_id')
      .eq('id', clienteId)
      .single()

    if (fetchError || !cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    // 3. ELIMINAR DE SUPABASE (Cascada debería borrar relaciones)
    const { error: deleteError } = await supabase
      .from('clients_mirror')
      .delete()
      .eq('id', clienteId)

    if (deleteError) {
      console.error('[Delete Cliente DB Error]', deleteError)
      return { success: false, error: deleteError.message }
    }

    // 4. ELIMINAR DE ODOO (Archivar)
    if (cliente.odoo_partner_id) {
      try {
        const { deletePartnerInOdoo } = await import('@/lib/odoo/client')
        await deletePartnerInOdoo(cliente.odoo_partner_id)
        console.log(`[Sync] Cliente ${clienteId} archivado en Odoo`)
      } catch (odooError) {
        console.error('[Delete Cliente Odoo Error]', odooError)
        // No fallamos la acción si Odoo falla, pero avisamos (warn)
        console.warn('Cliente borrado de DB pero falló Odoo archive')
      }
    }

    // 5. REVALIDAR
    revalidatePath('/dashboard/gerente')
    revalidatePath('/api/clientes/sin-asignar')

    return { success: true }

  } catch (error) {
    console.error('[Delete Cliente Error]', error)
    return { success: false, error: 'Error al eliminar cliente' }
  }
}

// =====================================================
// Actualizar Cliente (Solo Gerente)
// Actualiza en Supabase y Odoo
// =====================================================

const UpdateClienteSchema = z.object({
  id: z.string().uuid(),
  // Datos básicos
  nombre: z.string().min(1, 'Nombre requerido'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  
  // Dirección
  calle: z.string().min(1, 'Calle requerida'),
  numeroExterior: z.string().min(1, 'Número exterior requerido'),
  colonia: z.string().min(1, 'Colonia requerida'),
  codigoPostal: z.string().regex(/^\d{5}$/, 'CP debe tener 5 dígitos'),
  ciudad: z.string().default('Guadalajara'),
})

export async function updateCliente(input: z.infer<typeof UpdateClienteSchema>) {
  try {
    const validated = UpdateClienteSchema.parse(input)
    const supabase = await createClient()

    // 1. AUTH & ROLE CHECK
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autorizado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden editar clientes' }
    }

    // 2. OBTENER CLIENTE ACTUAL (para ID de Odoo)
    const { data: cliente, error: fetchError } = await supabase
      .from('clients_mirror')
      .select('odoo_partner_id')
      .eq('id', validated.id)
      .single()

    if (fetchError || !cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    // 3. ACTUALIZAR SUPABASE
    const { error: updateError } = await supabase
      .from('clients_mirror')
      .update({
        name: validated.nombre,
        phone: validated.telefono,
        street: validated.calle,
        numero_exterior: validated.numeroExterior,
        colonia: validated.colonia,
        codigo_postal: validated.codigoPostal,
        ciudad: validated.ciudad,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)

    if (updateError) {
      console.error('[Update Cliente DB Error]', updateError)
      return { success: false, error: updateError.message }
    }

    // 4. ACTUALIZAR ODOO
    if (cliente.odoo_partner_id) {
      try {
        const { updatePartnerInOdoo } = await import('@/lib/odoo/client')
        await updatePartnerInOdoo(cliente.odoo_partner_id, {
          name: validated.nombre,
          phone: validated.telefono,
          street: `${validated.calle} ${validated.numeroExterior}`,
          city: validated.ciudad,
          zip: validated.codigoPostal,
        })
        console.log(`[Sync] Cliente ${validated.id} actualizado en Odoo`)
      } catch (odooError) {
        console.error('[Update Cliente Odoo Error]', odooError)
        console.warn('Cliente actualizado en DB pero falló Odoo sync')
      }
    }

    // 5. REVALIDAR
    revalidatePath('/dashboard/gerente')
    
    return { success: true }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validación: ${error.issues[0].message}` }
    }
    console.error('[Update Cliente Error]', error)
    return { success: false, error: 'Error al actualizar cliente' }
  }
}
