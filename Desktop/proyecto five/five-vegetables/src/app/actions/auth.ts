// =====================================================
// SERVER ACTION: Autenticación por PIN
// Autentica usuarios usando su PIN de 4 dígitos
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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

    // 2. Obtener email del usuario
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      profile.id
    )

    if (authError || !authUser.user?.email) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // 3. Crear sesión usando signInWithPassword
    // Nota: Esto requiere que el usuario tenga una contraseña configurada
    // Como alternativa, podemos usar el admin API para crear un token
    
    // Crear un token de sesión usando admin API
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: profile.id,
    })

    if (sessionError || !sessionData) {
      console.error('Session creation error:', sessionError)
      return { success: false, error: 'Error al crear sesión' }
    }

    // 4. Establecer las cookies de sesión
    const cookieStore = await cookies()
    
    if (sessionData.session) {
      cookieStore.set('sb-access-token', sessionData.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: sessionData.session.expires_in,
      })

      cookieStore.set('sb-refresh-token', sessionData.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })
    }

    return {
      success: true,
      user: {
        id: profile.id,
        name: profile.full_name,
        role: profile.role,
      },
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'PIN debe tener 4 dígitos' }
    }

    console.error('[PIN Login Error]', error)
    return { success: false, error: 'Error al procesar login' }
  }
}
