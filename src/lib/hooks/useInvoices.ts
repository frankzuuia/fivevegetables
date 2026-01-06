// =====================================================
// HOOKS: Facturación CFDI
// useSolicitarFactura
// =====================================================

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { solicitarFactura } from '@/app/actions/invoices'

// =====================================================
// useSolicitarFactura - Mutation para generar CFDI
// =====================================================

export function useSolicitarFactura() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: {
      pedidoId: string
      datosFiscales: {
        rfc: string
        razonSocial: string
        regimenFiscal: string
        codigoPostal: string
        usoCFDI: string
        email: string
      }
    }) => {
      const result = await solicitarFactura(input)
      
      if (!result.success) {
        throw new Error(result.error || 'Error al generar factura')
      }
      
      return result
    },
    onSuccess: () => {
      // Invalidar queries de pedidos
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['vendedor-pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-entregados-vendedor'] })
    },
  })
}
