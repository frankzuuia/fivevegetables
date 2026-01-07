// =====================================================
// API: Autenticación por PIN
// Autentica usuarios usando su PIN de 4 dígitos
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    console.log('[Auth PIN] Recibido PIN:', pin)

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'PIN inválido' },
        { status: 400 }
      )
    }
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('[Auth PIN] Service Key exists:', !!serviceKey)

    // We need the Service Role Key to use auth.admin methods
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Buscar usuario por PIN
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, pin_code')
      .eq('pin_code', pin)
      .single()

    console.log('[Auth PIN] Profile Search Result:', { profile, error: profileError })

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
    
    // 3. Generar sesión para el usuario
    
    // Determinar redirect URL basado en rol
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectTo = profile.role === 'gerente' 
      ? `${baseUrl}/dashboard/gerente` 
      : `${baseUrl}/dashboard/vendedor`

    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
      options: {
        redirectTo
      }
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
        email: userData.user.email,
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
