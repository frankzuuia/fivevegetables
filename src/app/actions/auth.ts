// =====================================================
// SERVER ACTIONS: Autenticación con PIN
// Login usando PIN de 4 dígitos
// =====================================================

'use server'

/**
 * Login con PIN de 4 dígitos
 * Llama al API endpoint que maneja la autenticación
 */
export async function loginWithPIN(pin: string) {
  try {
    // Llamar al API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'PIN incorrecto',
      }
    }

    // Retornar datos del usuario y URL de sesión
    return {
      success: true,
      user: data.user,
      sessionUrl: data.sessionUrl,
    }

  } catch (error) {
    console.error('[Login PIN Error]', error)
    return {
      success: false,
      error: 'Error al iniciar sesión',
    }
  }
}
