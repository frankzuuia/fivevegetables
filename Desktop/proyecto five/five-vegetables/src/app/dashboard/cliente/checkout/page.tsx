// =====================================================
// PAGE: Checkout Cliente
// Flow completo: Carrito → Datos Entrega → createOrder → Success
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/hooks/useCart'
import { ModalDatosEntrega, type DeliveryData } from '@/components/orders/ModalDatosEntrega'
import { ModalDatosFiscales } from '@/components/orders/ModalDatosFiscales'
import { createClient } from '@/lib/supabase/client'
import { createOrder } from '@/app/actions/orders'
import { CheckCircle, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { items, clearCart, isEmpty, total } = useCart()
  
  const [step, setStep] = useState<'delivery' | 'invoice' | 'processing' | 'success'>('delivery')
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState<string | null>(null)
  
  useEffect(() => {
    // Redirect if cart empty
    if (isEmpty) {
      toast.error('Tu carrito está vacío')
      router.push('/dashboard/cliente')
      return
    }
    
    fetchClienteId()
  }, [isEmpty])
  
  const fetchClienteId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: cliente } = await supabase
        .from('clients_mirror')
        .select('id')
        .eq('profile_id', user.id)
        .single()
      
      if (cliente) setClienteId((cliente as any).id)
    } catch (error) {
      console.error('[Checkout fetchClienteId]', error)
    }
  }
  
  const handleDeliveryConfirm = async (data: DeliveryData) => {
    setDeliveryData(data)
    
    // If requestInvoice, show fiscal modal, else process order
    if (data.requestInvoice) {
      setStep('invoice')
    } else {
      await processOrder(data, null)
    }
  }
  
  const handleInvoiceSubmit = async (orderId: string) => {
    // Invoice data already saved, just show success
    setStep('success')
  }
  
  const processOrder = async (delivery: DeliveryData, fiscalData?: any) => {
    if (!clienteId) {
      toast.error('Cliente no encontrado')
      return
    }
    
    setStep('processing')
    
    try {
      const result = await createOrder({
        clienteId,
        items: items.map(item => ({
          productId: item.productId,
          odooProductId: item.odooProductId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          discountPercentage: 0,
        })),
        deliveryData: {
          contactName: delivery.contactName,
          phone: delivery.phone,
          restaurant: delivery.restaurant,
          street: delivery.street,
          colonia: delivery.colonia,
          codigoPostal: delivery.codigoPostal,
          referencias: delivery.referencias || '',
        },
        requestInvoice: delivery.requestInvoice,
        notes: '',
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Error al crear pedido')
      }
      
      setOrderId(result.orderId || null)
      clearCart()
      setStep('success')
      
      toast.success('¡Pedido creado exitosamente!')
    } catch (error) {
      console.error('[Checkout processOrder]', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar pedido')
      setStep('delivery')
    }
  }
  
  // Empty cart redirect
  if (isEmpty && step !== 'success') {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-morph-primary-50 to-white p-6">
      <div className="mx-auto max-w-2xl">
        {/* Delivery Modal */}
        {step === 'delivery' && (
          <ModalDatosEntrega
            onConfirm={handleDeliveryConfirm}
            onClose={() => router.push('/dashboard/cliente')}
          />
        )}
        
        {/* Invoice Modal */}
        {step === 'invoice' && orderId && deliveryData && (
          <ModalDatosFiscales
            pedidoId={orderId}
            onClose={() => {
              // Cancel invoice request, process without it
              if (deliveryData) {
                processOrder({ ...deliveryData, requestInvoice: false })
              }
            }}
          />
        )}
        
        {/* Processing State */}
        {step === 'processing' && (
          <div className="rounded-lg border border-morph-gray-200 bg-white p-12 text-center">
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-morph-primary-600" />
            <h2 className="mt-6 text-2xl font-bold text-morph-gray-900">
              Procesando tu pedido...
            </h2>
            <p className="mt-2 text-morph-gray-600">
              Estamos creando tu pedido en Odoo y Supabase
            </p>
          </div>
        )}
        
        {/* Success State */}
        {step === 'success' && (
          <div className="rounded-lg border-2 border-green-600 bg-gradient-to-br from-green-50 to-white p-12 text-center">
            <CheckCircle className="mx-auto h-20 w-20 text-green-600" />
            <h2 className="mt-6 text-3xl font-bold text-green-900">
              ¡Pedido Confirmado!
            </h2>
            <p className="mt-4 text-lg text-morph-gray-700">
              Tu pedido ha sido creado exitosamente
            </p>
            
            {orderId && (
              <div className="mt-6 rounded-lg bg-white p-4">
                <p className="text-sm text-morph-gray-600">Número de pedido</p>
                <p className="mt-1 font-mono text-lg font-bold text-morph-gray-900">
                  {orderId}
                </p>
              </div>
            )}
            
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => router.push('/dashboard/cliente')}
                className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-bold text-white transition-all hover:shadow-md"
              >
                Ver Mis Pedidos
              </button>
              <button
                onClick={() => router.push('/dashboard/cliente')}
                className="rounded-lg border-2 border-green-600 bg-white px-6 py-3 font-medium text-green-700 transition-all hover:bg-green-50"
              >
                Volver al Catálogo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
