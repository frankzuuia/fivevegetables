// =====================================================
// COMPONENT: Perfil Cliente
// Vista perfil cliente con vendedor asignado (Dashboard Cliente)
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { User, Phone, Mail, MapPin, FileText, MessageCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function PerfilCliente() {
  const supabase = createClient()
  const router = useRouter()
  const [clienteId, setClienteId] = useState<string | null>(null)
  
  useEffect(() => {
    fetchClienteId()
  }, [])
  
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
      console.error('[PerfilCliente fetchClienteId]', error)
    }
  }
  
  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', 'perfil', clienteId],
    queryFn: async () => {
      if (!clienteId) return null
      
      const { data, error } = await supabase
        .from('clients_mirror')
        .select(`
          *,
          price_lists:pricelist_id_new (name, type, discount_percentage),
          profiles:vendedor_id (full_name, phone, email)
        `)
        .eq('id', clienteId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!clienteId,
  })
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      toast.success('Sesión cerrada')
    } catch (error) {
      console.error('[Logout error]', error)
      toast.error('Error al cerrar sesión')
    }
  }
  
  const sendWhatsAppVendedor = () => {
    const vendedor = (cliente as any)?.profiles
    if (!vendedor?.phone) {
      toast.error('Vendedor sin teléfono asignado')
      return
    }
    
    const message = `Hola ${vendedor.full_name}, soy tu cliente. Necesito ayuda.`
    const cleanPhone = vendedor.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }
  
  if (isLoading || !cliente) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-morph-primary-200 border-t-morph-primary-600" />
          <p className="mt-4 text-morph-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }
  
  const vendedor = (cliente as any)?.profiles
  const pricelist = (cliente as any)?.price_lists
  const clienteData = cliente as any  // Cast for property access
  
  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-200 p-3">
            <User className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              👤 Mi Perfil
            </h2>
            <p className="text-sm text-morph-gray-600">
              Información de mi cuenta
            </p>
          </div>
        </div>
      </div>
      
      {/* Información Personal */}
      <div className="rounded-lg border border-morph-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-morph-gray-900">
          Información Personal
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-morph-gray-400" />
            <div>
              <p className="text-xs text-morph-gray-600">Nombre</p>
              <p className="font-medium text-morph-gray-900">{clienteData.name}</p>
            </div>
          </div>
          
          {clienteData.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-morph-gray-400" />
              <div>
                <p className="text-xs text-morph-gray-600">Email</p>
                <p className="font-medium text-morph-gray-900">{clienteData.email}</p>
              </div>
            </div>
          )}
          
          {clienteData.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-morph-gray-400" />
              <div>
                <p className="text-xs text-morph-gray-600">Teléfono</p>
                <p className="font-medium text-morph-gray-900">{clienteData.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Vendedor Asignado */}
      {vendedor && (
        <div className="rounded-lg border-2 border-green-600 bg-gradient-to-br from-green-50 to-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-green-900">
            <MessageCircle className="h-5 w-5" />
            Mi Vendedor
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-morph-gray-600">Nombre</p>
              <p className="text-lg font-bold text-morph-gray-900">
                {vendedor.full_name}
              </p>
            </div>
            
            {vendedor.phone && (
              <div>
                <p className="text-sm text-morph-gray-600">Teléfono</p>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-morph-gray-900">{vendedor.phone}</p>
                  <button
                    onClick={sendWhatsAppVendedor}
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                  >
                    <MessageCircle className="mr-1 inline h-4 w-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            )}
            
            {vendedor.email && (
              <div>
                <p className="text-sm text-morph-gray-600">Email</p>
                <p className="font-medium text-morph-gray-900">{vendedor.email}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Tarifa Personalizada */}
      {pricelist && (
        <div className="rounded-lg border border-morph-gray-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-morph-gray-900">
            <FileText className="h-5 w-5" />
            Mi Tarifa
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-morph-gray-900">{pricelist.name}</p>
              <p className="text-sm text-morph-gray-600">{pricelist.type}</p>
            </div>
            <span className="rounded-full bg-green-100 px-4 py-2 text-lg font-bold text-green-700">
              {pricelist.discount_percentage}% desc.
            </span>
          </div>
        </div>
      )}
      
      {/* Dirección de Entrega */}
      {(clienteData.street || clienteData.colonia) && (
        <div className="rounded-lg border border-morph-gray-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-morph-gray-900">
            <MapPin className="h-5 w-5" />
            Dirección de Entrega
          </h3>
          
          <div className="space-y-1 text-morph-gray-700">
            {clienteData.street && (
              <p>{clienteData.street} {clienteData.numero_exterior}</p>
            )}
            {clienteData.colonia && <p>Col. {clienteData.colonia}</p>}
            {clienteData.codigo_postal && (
              <p>C.P. {clienteData.codigo_postal}, {clienteData.ciudad || 'Guadalajara'}</p>
            )}
            {clienteData.referencias && (
              <p className="mt-2 text-sm text-morph-gray-600">
                Ref: {clienteData.referencias}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full rounded-lg border-2 border-red-600 bg-white px-6 py-3 font-medium text-red-600 transition-all hover:bg-red-50"
      >
        <LogOut className="mr-2 inline h-5 w-5" />
        Cerrar Sesión
      </button>
    </div>
  )
}
