// =====================================================
// SERVER ACTION: Autenticación por PIN
// Autentica usuarios usando su PIN de 4 dígitos
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const PINLoginSchema = z.object({
  pin: z.string().length(4),
})

export async function loginWithPIN(input: z.infer<typeof PINLoginSchema>) {
  try {
    const validated = PINLoginSchema.parse(input)
    const supabase = await createClient()

    // 1. Buscar usuario por PIN
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('pin_code', validated.pin)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'PIN incorrecto' }
    }

    // 2. Obtener email del usuario desde auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      profile.id
    )

    if (authError || !authUser.user?.email) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // 3. Generar link mágico para autenticación
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email,
    })

    if (magicLinkError || !magicLinkData) {
      console.error('Magic link error:', magicLinkError)
      return { success: false, error: 'Error al crear sesión' }
    }

    return {
      success: true,
      user: {
        id: profile.id,
        name: profile.full_name,
        role: profile.role,
      },
      email: authUser.user.email,
      // Extraer tokens del link mágico
      hashed_token: magicLinkData.properties.hashed_token,
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'PIN debe tener 4 dígitos' }
    }

    console.error('[PIN Login Error]', error)
    return { success: false, error: 'Error al procesar login' }
  }
}
