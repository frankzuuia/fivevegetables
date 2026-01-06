// =====================================================
// API: Autenticación por PIN
// Autentica usuarios usando su PIN de 4 dígitos
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'PIN inválido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Buscar usuario por PIN
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('pin_code', pin)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'PIN incorrecto' },
        { status: 401 }
      )
    }

    // 2. Obtener datos del usuario de auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      profile.id
    )

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // 3. Generar sesión para el usuario
    // Usamos signInWithPassword internamente pero con el email del usuario
    // Nota: Esto requiere que tengamos el email almacenado
    
    // OPCIÓN ALTERNATIVA: Usar admin API para generar token directamente
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
    })

    if (sessionError || !sessionData) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Error al crear sesión' },
        { status: 500 }
      )
    }

    // Retornar datos del usuario y URL de sesión
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        name: profile.full_name,
        role: profile.role,
        email: profile.email,
      },
      sessionUrl: sessionData.properties.action_link,
    })

  } catch (error) {
    console.error('PIN Auth error:', error)
    return NextResponse.json(
      { error: 'Error al procesar autenticación' },
      { status: 500 }
    )
  }
}
