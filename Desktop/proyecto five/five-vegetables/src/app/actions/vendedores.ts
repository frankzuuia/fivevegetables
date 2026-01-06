// =====================================================
// SERVER ACTION: Vendedores
// Creación y gestión de vendedores por el gerente
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const CreateVendedorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombreCompleto: z.string().min(1),
  telefono: z.string().regex(/^\d{10}$/),
})

const EliminarVendedorSchema = z.object({
  vendedorId: z.string().uuid(),
  clientesReasignacion: z.array(z.object({
    clienteId: z.string().uuid(),
    nuevoVendedorId: z.string().uuid(),
  })),
})

const DEFAULT_STORE_ID = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || '00000000-0000-0000-0000-000000000000'

// Función para generar PIN de 4 dígitos
function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function createVendedor(input: z.infer<typeof CreateVendedorSchema>) {
  try {
    const validated = CreateVendedorSchema.parse(input)
    const supabase = await createClient()
    
    // Verificar que quien lo ejecuta sea gerente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden crear vendedores' }
    }
    
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
    })
    
    if (authError) return { success: false, error: authError.message }
    if (!authData.user) return { success: false, error: 'Error al crear usuario' }
    
    // 2. Generar PIN de 4 dígitos
    const pin = generatePIN()
    
    // 3. Crear Profile como VENDEDOR
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        store_id: DEFAULT_STORE_ID,
        full_name: validated.nombreCompleto,
        role: 'vendedor',
        phone: validated.telefono,
        pin_code: pin,
      })
    
    if (profileError) {
      console.error('[Profile Vendedor Error]', profileError)
      return { success: false, error: 'Error al crear perfil de vendedor' }
    }
    
    console.log(`[Vendedor Created] ${validated.nombreCompleto} - ${validated.email}`)
    
    revalidatePath('/dashboard/gerente')
    
    return { success: true, pin }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` }
    }
    
    console.error('[Create Vendedor Error]', error)
    return { success: false, error: 'Error al crear vendedor' }
  }
}

export async function eliminarVendedor(input: z.infer<typeof EliminarVendedorSchema>) {
  try {
    const validated = EliminarVendedorSchema.parse(input)
    const supabase = await createClient()
    
    // Verificar que quien lo ejecuta sea gerente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden eliminar vendedores' }
    }
    
    // 1. Reasignar clientes si hay
    if (validated.clientesReasignacion.length > 0) {
      for (const reasignacion of validated.clientesReasignacion) {
        await supabase
          .from('clients_mirror')
          .update({ vendedor_id: reasignacion.nuevoVendedorId })
          .eq('id', reasignacion.clienteId)
      }
    }
    
    // 2. Soft delete del vendedor (desactivar)
    const { error: deactivateError } = await supabase
      .from('profiles')
      .update({
        active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: user.id,
      })
      .eq('id', validated.vendedorId)
    
    if (deactivateError) {
      console.error('[Deactivate Vendedor Error]', deactivateError)
      return { success: false, error: 'Error al desactivar vendedor' }
    }
    
    console.log(`[Vendedor Deactivated] ${validated.vendedorId}`)
    
    revalidatePath('/dashboard/gerente')
    
    return { success: true }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` }
    }
    
    console.error('[Eliminar Vendedor Error]', error)
    return { success: false, error: 'Error al eliminar vendedor' }
  }
}
