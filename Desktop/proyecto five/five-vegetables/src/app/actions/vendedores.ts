// =====================================================
// SERVER ACTION: Eliminar Vendedor
// Reasignación masiva clientes + soft delete vendedor
// =====================================================

'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { updatePartnerPricelist } from '@/lib/odoo/client'
import { revalidatePath } from 'next/cache'

const EliminarVendedorSchema = z.object({
  vendedorId: z.string().uuid(),
  clientesReasignacion: z.array(
    z.object({
      clienteId: z.string().uuid(),
      nuevoVendedorId: z.string().uuid(),
    })
  ),
})

export async function eliminarVendedor(input: z.infer<typeof EliminarVendedorSchema>) {
  try {
    const validated = EliminarVendedorSchema.parse(input)
    const supabase = await createClient()
    
    // AUTH - Solo gerente
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: 'No autorizado' }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, store_id')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'gerente') {
      return { success: false, error: 'Solo gerentes pueden eliminar vendedores' }
    }
    
    // Validar vendedor existe y pertenece al store
    const { data: vendedor } = await supabase
      .from('profiles')
      .select('id, full_name, store_id, active')
      .eq('id', validated.vendedorId)
      .eq('store_id', profile.store_id)
      .single()
    
    if (!vendedor) {
      return { success: false, error: 'Vendedor no encontrado' }
    }
    
    if (!vendedor.active) {
      return { success: false, error: 'Vendedor ya está desactivado' }
    }
    
    // Obtener clientes del vendedor
    const { data: clientesVendedor } = await supabase
      .from('clients_mirror')
      .select('id')
      .eq('vendedor_id', validated.vendedorId)
    
    if (!clientesVendedor || clientesVendedor.length === 0) {
      // Sin clientes, puede eliminar directamente
      const { error: deactivateError } = await supabase
        .from('profiles')
        .update({
          active: false,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', validated.vendedorId)
      
      if (deactivateError) {
        return { success: false, error: 'Error al desactivar vendedor' }
      }
      
      revalidatePath('/dashboard/gerente')
      return { success: true, message: 'Vendedor eliminado exitosamente (sin clientes)' }
    }
    
    // Validar que se proporcionó reasignación para TODOS los clientes
    const clienteIds = clientesVendedor.map(c => c.id)
    const reasignadosIds = validated.clientesReasignacion.map(r => r.clienteId)
    
    const faltantes = clienteIds.filter(id => !reasignadosIds.includes(id))
    if (faltantes.length > 0) {
      return {
        success: false,
        error: `Falta reasignar ${faltantes.length} cliente(s). Debes reasignar TODOS antes de eliminar.`
      }
    }
    
    // Procesar reasignaciones
    for (const reasignacion of validated.clientesReasignacion) {
      // Validar nuevo vendedor existe y es del mismo store
      const { data: nuevoVendedor } = await supabase
        .from('profiles')
        .select('id, store_id')
        .eq('id', reasignacion.nuevoVendedorId)
        .eq('role', 'vendedor')
        .eq('store_id', profile.store_id)
        .single()
      
      if (!nuevoVendedor) {
        return { success: false, error: `Vendedor destino no válido` }
      }
      
      // UPDATE clients_mirror
      const { error: updateClienteError } = await supabase
        .from('clients_mirror')
        .update({ vendedor_id: reasignacion.nuevoVendedorId })
        .eq('id', reasignacion.clienteId)
      
      if (updateClienteError) {
        console.error('[Update Cliente Error]', updateClienteError)
        return { success: false, error: 'Error al reasignar cliente' }
      }
      
      // UPDATE vendedor_clientes relation
      const { error: deleteRelError } = await supabase
        .from('vendedor_clientes')
        .delete()
        .eq('cliente_id', reasignacion.clienteId)
        .eq('vendedor_id', validated.vendedorId)
      
      if (deleteRelError) console.error('[Delete Rel Error]', deleteRelError)
      
      const { error: insertRelError } = await supabase
        .from('vendedor_clientes')
        .insert({
          vendedor_id: reasignacion.nuevoVendedorId,
          cliente_id: reasignacion.clienteId,
        })
      
      if (insertRelError) console.error('[Insert Rel Error]', insertRelError)
      
      // Odoo sync (best effort, no bloquear si falla)
      try {
        const { data: cliente } = await supabase
          .from('clients_mirror')
          .select('odoo_partner_id, pricelist_id, price_lists(odoo_pricelist_id)')
          .eq('id', reasignacion.clienteId)
          .single()
        
        if (cliente?.odoo_partner_id && (cliente as any).price_lists?.odoo_pricelist_id) {
          await updatePartnerPricelist(
            cliente.odoo_partner_id,
            (cliente as any).price_lists.odoo_pricelist_id
          )
        }
      } catch (odooError) {
        console.error('[Odoo Sync Error]', odooError)
        // No fallar por error Odoo
      }
    }
    
    // Soft delete vendedor
    const { error: deactivateError } = await supabase
      .from('profiles')
      .update({
        active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', validated.vendedorId)
    
    if (deactivateError) {
      return { success: false, error: 'Error al desactivar vendedor' }
    }
    
    revalidatePath('/dashboard/gerente')
    revalidatePath('/api/clientes/sin-asignar')
    
    return {
      success: true,
      message: `Vendedor eliminado. ${validated.clientesReasignacion.length} cliente(s) reasignado(s).`
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos de reasignación inválidos' }
    }
    
    console.error('[Eliminar Vendedor Error]', error)
    return { success: false, error: 'Error al eliminar vendedor' }
  }
}
