// =====================================================
// SERVER ACTIONS: Facturación CFDI México
// Generación de facturas post-entrega
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createInvoice, getInvoicePDF } from '@/lib/odoo/client'
import { revalidatePath } from 'next/cache'

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const DatosFiscalesSchema = z.object({
  rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'RFC inválido (formato: ABC123456XXX)',
  }),
  razonSocial: z.string().min(1, 'Razón social requerida'),
  regimenFiscal: z.string().regex(/^\d{3}$/, {
    message: 'Régimen fiscal debe ser código de 3 dígitos',
  }),
  codigoPostal: z.string().regex(/^\d{5}$/, {
    message: 'Código postal debe tener 5 dígitos',
  }),
  usoCFDI: z.string().regex(/^[A-Z]\d{2}$/, {
    message: 'Uso de CFDI inválido (formato: G01, G03, etc.)',
  }),
  email: z.string().email('Email inválido'),
})

const SolicitarFacturaSchema = z.object({
  pedidoId: z.string().uuid(),
  datosFiscales: DatosFiscalesSchema,
})

// =====================================================
// Solicitar Factura (Cliente/Vendedor/Gerente)
// =====================================================

export async function solicitarFactura(
  input: z.infer<typeof SolicitarFacturaSchema>
) {
  try {
    // 1. VALIDAR INPUT
    const validated = SolicitarFacturaSchema.parse(input)
    
    const supabase = await createClient()
    
    // 2. AUTH
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'No autorizado' }
    }
    
    // 3. GET PROFILE
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return { success: false, error: 'Perfil no encontrado' }
    }
    
    // 4. FETCH PEDIDO CON RELACIONES
    const { data: pedido } = await supabase
      .from('orders_shadow')
      .select(`
        *,
        clients_mirror!inner (
          profile_id,
          odoo_partner_id,
          vendedor_id
        )
      `)
      .eq('id', validated.pedidoId)
      .single()
    
    if (!pedido) {
      return { success: false, error: 'Pedido no encontrado' }
    }
    
    // 5. AUTORIZACIÓN (Cliente owner | Vendedor asignado | Gerente)
    const isCliente = pedido.clients_mirror.profile_id === user.id
    const isVendedor =
      profile.role === 'vendedor' && pedido.vendedor_id === user.id
    const isGerente = profile.role === 'gerente'
    
    if (!isCliente && !isVendedor && !isGerente) {
      return {
        success: false,
        error: 'No tienes permiso para facturar este pedido',
      }
    }
    
    // 6. VERIFICACIONES DE ESTADO
    
    // a) Pedido debe estar entregado
    if (pedido.status !== 'delivered') {
      return {
        success: false,
        error: 'El pedido debe estar entregado para generar factura',
      }
    }
    
    // b) Debe haber solicitado factura
    if (!pedido.request_invoice) {
      return {
        success: false,
        error: 'Este pedido no solicitó factura',
      }
    }
    
    // c) No facturado aún
    if (pedido.invoice_status === 'invoiced') {
      return {
        success: false,
        error: 'Ya existe factura para este pedido',
        invoiceUrl: pedido.invoice_pdf_url || undefined,
      }
    }
    
    // d) Debe tener odoo_order_id
    if (!pedido.odoo_order_id) {
      return {
        success: false,
        error: 'Pedido no sincronizado con Odoo. Contacte soporte.',
      }
    }
    
    // 7. GUARDAR DATOS FISCALES EN SUPABASE (opcional: tabla separada)
    // Por ahora, se incluyen en las notas del pedido
    const datosFiscalesText = `
DATOS FISCALES:
RFC: ${validated.datosFiscales.rfc}
Razón Social: ${validated.datosFiscales.razonSocial}
Régimen Fiscal: ${validated.datosFiscales.regimenFiscal}
Código Postal: ${validated.datosFiscales.codigoPostal}
Uso CFDI: ${validated.datosFiscales.usoCFDI}
Email: ${validated.datosFiscales.email}
`
    
    await supabase
      .from('orders_shadow')
      .update({
        notes: (pedido.notes || '') + '\n\n' + datosFiscalesText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.pedidoId)
    
    // ===== 8. GENERAR FACTURA EN ODOO =====
    
    let odooInvoiceId: number
    
    try {
      odooInvoiceId = await createInvoice(pedido.odoo_order_id, {
        l10n_mx_edi_usage: validated.datosFiscales.usoCFDI,
      })
      
      console.log(
        `[Invoice Created] Odoo invoice ${odooInvoiceId} for order ${pedido.order_number}`
      )
    } catch (odooError) {
      console.error('[Odoo Create Invoice Error]', odooError)
      return {
        success: false,
        error:
          'Error al generar factura en Odoo: ' +
          (odooError instanceof Error ? odooError.message : 'Error desconocido'),
      }
    }
    
    // 9. OBTENER PDF URL
    
    // Esperar breve tiempo para que Odoo genere el PDF
    // En producción: implementar webhook o polling
    await new Promise((resolve) => setTimeout(resolve, 3000))
    
    let pdfUrl: string
    
    try {
      pdfUrl = await getInvoicePDF(odooInvoiceId)
    } catch (pdfError) {
      console.error('[Odoo Get PDF Error]', pdfError)
      // Si falla obtener PDF, marcar como facturado pero sin URL
      pdfUrl = ''
    }
    
    // 10. UPDATE SUPABASE
    const { error: updateError } = await supabase
      .from('orders_shadow')
      .update({
        invoice_status: 'invoiced',
        invoice_pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.pedidoId)
    
    if (updateError) {
      console.error('[Invoice Update Supabase Error]', updateError)
      // Factura creada en Odoo pero fallo actualizar Supabase
      return {
        success: false,
        error: 'Factura generada pero error al actualizar registro',
      }
    }
    
    // 11. ENVIAR EMAIL (opcional - implementar más adelante)
    // await sendInvoiceEmail(validated.datosFiscales.email, pdfUrl, xmlUrl)
    
    // 12. REVALIDAR RUTAS
    revalidatePath('/dashboard/cliente')
    revalidatePath('/dashboard/vendedor')
    revalidatePath(`/orders/${validated.pedidoId}`)
    
    return {
      success: true,
      invoiceUrl: pdfUrl,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validación: ${firstError.path.join('.')}: ${firstError.message}`,
      }
    }
    
    console.error('[Solicitar Factura Error]', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Error interno del servidor',
    }
  }
}
