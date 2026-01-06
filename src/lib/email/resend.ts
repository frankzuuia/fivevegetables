// =====================================================
// EMAIL UTILITY: Resend Integration
// Send emails using Resend API
// =====================================================

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const APP_NAME = 'Five Vegetables'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fivevegetables.com'

/**
 * Send PIN to user email
 */
export async function sendPINEmail({
  to,
  userName,
  pin,
  role,
}: {
  to: string
  userName: string
  pin: string
  role: 'cliente' | 'gerente' | 'vendedor'
}) {
  try {
    const roleNames = {
      cliente: 'Cliente',
      gerente: 'Gerente',
      vendedor: 'Vendedor',
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🔐 Tu PIN de acceso - ${APP_NAME}`,
      html: getPINEmailTemplate({ userName, pin, role: roleNames[role] }),
    })

    if (error) {
      console.error('[Email Error]', error)
      return { success: false, error }
    }

    console.log('[Email Sent]', { to, emailId: data?.id })
    return { success: true, data }
  } catch (error) {
    console.error('[Email Send Failed]', error)
    return { success: false, error }
  }
}

/**
 * HTML Template for PIN Email
 */
function getPINEmailTemplate({
  userName,
  pin,
  role,
}: {
  userName: string
  pin: string
  role: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu PIN de Acceso</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .title {
      color: #059669;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
    }
    .pin-section {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      border: 4px solid #10b981;
    }
    .pin-label {
      color: #ffffff;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .pin-code {
      background-color: #ffffff;
      color: #059669;
      font-size: 48px;
      font-weight: bold;
      letter-spacing: 8px;
      padding: 20px;
      border-radius: 8px;
      display: inline-block;
      font-family: 'Courier New', monospace;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .warning-title {
      color: #d97706;
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .warning-text {
      color: #92400e;
      font-size: 14px;
      margin: 5px 0;
    }
    .instructions {
      background-color: #f0fdf4;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .instructions h3 {
      color: #059669;
      margin-top: 0;
      font-size: 18px;
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
      color: #065f46;
    }
    .cta-button {
      display: inline-block;
      background-color: #059669;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .cta-button:hover {
      background-color: #047857;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #059669;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🥬</div>
      <h1 class="title">${APP_NAME}</h1>
      <p class="subtitle">¡Bienvenido, ${userName}!</p>
    </div>

    <p>Te damos la bienvenida como <strong>${role}</strong> a nuestra plataforma.</p>
    
    <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tu <strong>PIN de acceso personal</strong>:</p>

    <div class="pin-section">
      <div class="pin-label">Tu PIN de 4 Dígitos</div>
      <div class="pin-code">${pin}</div>
    </div>

    <div class="warning">
      <div class="warning-title">⚠️ IMPORTANTE - Guarda este PIN</div>
      <p class="warning-text">• Este PIN es personal e intransferible</p>
      <p class="warning-text">• Lo necesitarás cada vez que inicies sesión</p>
      <p class="warning-text">• No lo compartas con nadie</p>
      <p class="warning-text">• Si lo olvidas, contacta a tu administrador</p>
    </div>

    <div class="instructions">
      <h3>📱 Cómo iniciar sesión:</h3>
      <ol>
        <li>Visita nuestra página de inicio de sesión</li>
        <li>Ingresa tu PIN de 4 dígitos usando el teclado numérico</li>
        <li>¡Listo! Tendrás acceso a tu cuenta</li>
      </ol>
    </div>

    <div style="text-align: center;">
      <a href="${APP_URL}/auth/login" class="cta-button">
        🔐 Ingresar Ahora
      </a>
    </div>

    <div class="footer">
      <p>Este correo fue enviado automáticamente desde ${APP_NAME}</p>
      <p>Si no solicitaste este PIN, ignora este mensaje</p>
      <p style="margin-top: 20px;">
        ¿Necesitas ayuda? <a href="mailto:soporte@fivevegetables.com">Contáctanos</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
