// =====================================================
// SERVER ACTION: Signup Cliente
// Auto-registro cliente → Odoo + Supabase  
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
  colonia: z.string().min(1),
  codigoPostal: z.string().regex(/^\d{5}$/),
})

const DEFAULT_STORE_ID = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

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
    
    // 2. Crear Partner en Odoo
    let odooPartnerId: number
    try {
      odooPartnerId = await createPartnerInOdoo({
        name: validated.restaurant,
        email: validated.email,
        phone: validated.telefono,
        street: `${validated.calle} ${validated.numeroExterior}`,
        city: 'Guadalajara',
        zip: validated.codigoPostal,
      })
    } catch (odooError) {
      console.error('[Odoo Partner Error]', odooError)
      return { success: false, error: 'Error al crear cliente en Odoo' }
    }
    
    // 3. Crear Profile (server-side con service role implícito)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        store_id: DEFAULT_STORE_ID,
        full_name: validated.nombreCompleto,
        role: 'cliente',
        phone: validated.telefono,
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
        colonia: validated.colonia,
        codigo_postal: validated.codigoPostal,
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
      })
    
    if (clienteError) {
      console.error('[Cliente Error]', clienteError)
      return { success: false, error: 'Error al registrar cliente' }
    }
    
    revalidatePath('/dashboard/gerente')
    revalidatePath('/api/clientes/sin-asignar')
    
    return { success: true }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` }
    }
    
    console.error('[Signup Cliente Error]', error)
    return { success: false, error: 'Error al procesar registro' }
  }
}
