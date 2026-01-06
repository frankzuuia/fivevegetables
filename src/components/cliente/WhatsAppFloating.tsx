// =====================================================
// COMPONENT: WhatsApp Floating Button
// Contacta VENDEDOR ASIGNADO del cliente (Dashboard Cliente)
// =====================================================

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function WhatsAppFloating() {
  const supabase = createClient()
  const [vendedor, setVendedor] = useState<{
    full_name: string
    phone: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchVendedor()
  }, [])
  
  const fetchVendedor = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: cliente, error } = await supabase
        .from('clients_mirror')
        .select(`
          vendedor_id,
          profiles:vendedor_id (
            full_name,
            phone
          )
        `)
        .eq('profile_id', user.id)
        .single()
      
      if (error) throw error
      
      if (cliente && (cliente as any).profiles) {
        setVendedor((cliente as any).profiles)
      }
    } catch (error) {
      console.error('[WhatsAppFloating Error]', error)
    } finally {
      setLoading(false)
    }
  }
  
  const sendWhatsAppVendedor = () => {
    if (!vendedor?.phone) {
      toast.error('Tu vendedor aún no tiene teléfono asignado')
      return
    }
    
    const message = `Hola ${vendedor.full_name}, soy tu cliente. Necesito ayuda.`
    const cleanPhone = vendedor.phone.replace(/\D/g, '')
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      '_blank'
    )
  }
  
  if (loading) {
    return (
      <button
        disabled
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-300 shadow-lg"
      >
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </button>
    )
  }
  
  if (!vendedor) {
    return (
      <button
        disabled
        title="Esperando asignación de vendedor"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-300 shadow-lg"
      >
        <MessageCircle className="h-6 w-6 text-gray-500" />
      </button>
    )
  }
  
  return (
    <button
      onClick={sendWhatsAppVendedor}
      title={`Contactar a ${vendedor.full_name}`}
      className="group fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg transition-all hover:scale-110 hover:bg-green-600 hover:shadow-xl"
    >
      <MessageCircle className="h-6 w-6 text-white" />
      
      {/* Pulse animation */}
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
    </button>
  )
}
