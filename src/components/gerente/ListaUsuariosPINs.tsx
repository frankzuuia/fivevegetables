// =====================================================
// COMPONENT: Widget Resumen Usuarios (PINs)
// Muestra conteo y abre el Gestor Completo
// =====================================================

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Users, KeyRound, ChevronRight, Settings2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GestorUsuariosPINModal } from './GestorUsuariosPINModal'

interface User {
  id: string
  full_name: string
  role: string
  phone: string
  pin_code: string
}

export function ListaUsuariosPINs() {
  const supabase = createClient()
  const [modalOpen, setModalOpen] = useState(false)

  // Obtener vendedores
  const { data: vendedores, refetch: refetchVendedores } = useQuery({
    queryKey: ['vendedores-pins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, pin_code')
        .eq('role', 'vendedor')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data as User[]
    },
  })

  // Obtener clientes
  const { data: clientes, refetch: refetchClientes } = useQuery({
    queryKey: ['clientes-pins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, pin_code')
        .eq('role', 'cliente')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data as User[]
    },
  })

  const refetchAll = () => {
      refetchVendedores()
      refetchClientes()
  }

  const totalVendedores = vendedores?.length || 0
  const totalClientes = clientes?.length || 0

  return (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta Vendedores */}
            <Card variant="flat" className="p-4 border border-indigo-100 bg-indigo-50/30 flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2.5 rounded-full text-indigo-600">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Vendedores</h4>
                        <p className="text-xs text-gray-500">{totalVendedores} activos</p>
                    </div>
                </div>
                {/* Solo mostramos botón si hay data, o un placeholder si no */}
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)} className="text-indigo-600 hover:bg-indigo-50">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </Card>

            {/* Tarjeta Clientes PINs */}
            <Card variant="flat" className="p-4 border border-blue-100 bg-blue-50/30 flex items-center justify-between hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
                         <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">Accesos Clientes</h4>
                        <p className="text-xs text-gray-500">{totalClientes} con PIN</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)} className="text-blue-600 hover:bg-blue-50">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </Card>
        </div>

        {/* Modal Gestor Completo */}
        <GestorUsuariosPINModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            vendedores={vendedores || []}
            clientes={clientes || []}
            refetchData={refetchAll}
        />
    </>
  )
}