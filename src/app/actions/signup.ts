// =====================================================
// SERVER ACTIONS: Signup 
// Registro de clientes y gerentes
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createPartnerInOdoo } from '@/lib/odoo/client'
import { revalidatePath } from 'next/cache'

const SignupClienteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombreCompleto: z.string().min(1),
  telefono: z.string().regex(/^\d{10}$/),
  restaurant: z.string().min(1),
  calle: z.string().min(1),
  numeroExterior: z.string().min(1),
  entreCalles: z.string().optional(),
  colonia: z.string().min(1),
  codigoPostal: z.string().regex(/^\d{5}$/),
})

const SignupGerenteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombreCompleto: z.string().min(1),
  telefono: z.string().regex(/^\d{10}$/),
  nombreNegocio: z.string().min(1),
})

const DEFAULT_STORE_ID = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

// Función para generar PIN de 4 dígitos
function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function signupCliente(input: z.infer<typeof SignupClienteSchema>) {
  try {
    const validated = SignupClienteSchema.parse(input)
    const supabase = await createClient()
    
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
    })
    
    if (authError) return { success: false, error: authError.message }
    if (!authData.user) return { success: false, error: 'Error al crear usuario' }
    
    // 2. Crear Partner en Odoo (OPCIONAL - no bloquea registro)
    let odooPartnerId: number | null = null
    try {
      odooPartnerId = await createPartnerInOdoo({
        name: validated.restaurant,
        email: validated.email,
        phone: validated.telefono,
        street: `${validated.calle} ${validated.numeroExterior}`,
        city: 'Guadalajara',
        zip: validated.codigoPostal,
      })
      console.log('[Odoo] Partner created successfully:', odooPartnerId)
    } catch (odooError) {
      console.error('[Odoo Partner Error - Continuing without Odoo]', odooError)
      // ⚠️ Continuamos sin Odoo - el cliente se registra solo en Supabase
    }
    
    // 3. Generar PIN de 4 dígitos
    const pin = generatePIN()
    
    // 4. Crear Profile (server-side con service role implícito)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        store_id: DEFAULT_STORE_ID,
        full_name: validated.nombreCompleto,
        role: 'cliente',
        phone: validated.telefono,
        pin_code: pin,
      })
    
    if (profileError) {
      console.error('[Profile Error]', profileError)
      return { success: false, error: 'Error al crear perfil' }
    }
    
    // 4. Crear Cliente en Supabase (vendedor_id = NULL)
    const { error: clienteError } = await supabase
      .from('clients_mirror')
      .insert({
        profile_id: authData.user.id,
        store_id: DEFAULT_STORE_ID,
        odoo_partner_id: odooPartnerId,
        name: validated.restaurant,
        email: validated.email,
        phone: validated.telefono,
        vendedor_id: null, // ⭐ SIN ASIGNAR (gerente asignará)
        pricelist_id: null,
        street: validated.calle,
        numero_exterior: validated.numeroExterior,
        entre_calles: validated.entreCalles || null,
        colonia: validated.colonia,
        codigo_postal: validated.codigoPostal,
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        pais: 'México',
      })
    
    if (clienteError) {
      console.error('[Cliente Error]', clienteError)
      return { success: false, error: 'Error al registrar cliente' }
    }
    
    revalidatePath('/dashboard/gerente')
    revalidatePath('/api/clientes/sin-asignar')
    
    // Enviar PIN por email
    try {
      const { sendPINEmail } = await import('@/lib/email/resend')
      await sendPINEmail({
        to: validated.email,
        userName: validated.nombreCompleto,
        pin,
        role: 'cliente',
      })
    } catch (emailError) {
      console.error('[Email Error - Continuing]', emailError)
      // No bloqueamos el registro si falla el email
    }
    
    return { success: true, pin }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` }
    }
    
    console.error('[Signup Cliente Error]', error)
    return { success: false, error: 'Error al procesar registro' }
  }
}

// =====================================================
// SIGNUP GERENTE
// =====================================================

export async function signupGerente(input: z.infer<typeof SignupGerenteSchema>) {
  try {
    const validated = SignupGerenteSchema.parse(input)
    const supabase = await createClient()
    
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
    })
    
    if (authError) return { success: false, error: authError.message }
    if (!authData.user) return { success: false, error: 'Error al crear usuario' }
    
    // 2. Generar PIN de 4 dígitos
    const pin = generatePIN()
    
    // 3. Crear Profile como GERENTE
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        store_id: DEFAULT_STORE_ID,
        full_name: validated.nombreCompleto,
        role: 'gerente',
        phone: validated.telefono,
        pin_code: pin,
      })
    
    if (profileError) {
      console.error('[Profile Gerente Error]', profileError)
      return { success: false, error: 'Error al crear perfil de gerente' }
    }
    
    console.log(`[Gerente Created] ${validated.nombreCompleto} - ${validated.email}`)
    
    // Enviar PIN por email
    try {
      const { sendPINEmail } = await import('@/lib/email/resend')
      await sendPINEmail({
        to: validated.email,
        userName: validated.nombreCompleto,
        pin,
        role: 'gerente',
      })
    } catch (emailError) {
      console.error('[Email Error - Continuing]', emailError)
      // No bloqueamos el registro si falla el email
    }
    
    return { success: true, pin }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` }
    }
    
    console.error('[Signup Gerente Error]', error)
    return { success: false, error: 'Error al procesar registro de gerente' }
  }
}
