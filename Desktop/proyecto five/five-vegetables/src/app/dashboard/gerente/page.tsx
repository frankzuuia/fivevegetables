// =====================================================
// PAGE: Dashboard Gerente
// Vista principal con métricas, rankings y gestión
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGerenteMetrics } from '@/lib/hooks/useMetrics'
import { MetricCard } from '@/components/ui/MetricCard'
import { FilterAccordion, type FilterOption } from '@/components/ui/FilterAccordion'
import { RankingClientes } from '@/components/gerente/RankingClientes'
import { RankingVendedores } from '@/components/gerente/RankingVendedores'
import { ClientesSinAsignar } from '@/components/gerente/ClientesSinAsignar'
import { GestionClientes } from '@/components/gerente/GestionClientes'
import { VisionRayosX } from '@/components/gerente/VisionRayosX'
import { ModalDetalleCliente } from '@/components/gerente/ModalDetalleCliente'
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react'

export default function DashboardGerentePage() {
  const supabase = createClient()
  const [filter, setFilter] = useState<FilterOption>('hoy')
  
  // Get store_id del usuario autenticado
  const [storeId, setStoreId] = useState<string>('')
  
  // Modal detalle cliente
  const [selectedCliente, setSelectedCliente] = useState<{ id: string; name: string } | null>(null)
  
  // Effect para obtener storeId
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('store_id')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile && (profile as any).store_id) {
              setStoreId((profile as any).store_id)
            }
          })
      }
    })
  }, [supabase])
  
  const { data: metrics, isLoading } = useGerenteMetrics(storeId, filter)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-morph-primary-50 to-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-morph-gray-900">
              Dashboard Gerente
            </h1>
            <p className="mt-2 text-morph-gray-600">
              Vista general del negocio y gestión de equipos
            </p>
          </div>
          
          <div className="w-full sm:w-auto">
            <FilterAccordion
              defaultFilter={filter}
              onFilterChange={setFilter}
            />
          </div>
        </div>
        
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Ingresos Totales"
            value={`$${(metrics?.totalRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend={{ value: 0, isPositive: true }}
          />
          
          <MetricCard
            title="Total Pedidos"
            value={metrics?.totalOrders?.toString() || '0'}
            icon={ShoppingCart}
          />
          
          <MetricCard
            title="Ticket Promedio"
            value={`$${(metrics?.averageOrderValue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
          />
          
          <MetricCard
            title="Clientes Únicos"
            value={metrics?.totalOrders?.toString() || '0'}
            icon={Users}
          />
        </div>
        
        {/* Rankings */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RankingClientes
            data={metrics?.topClients || []}
            isLoading={isLoading}
            onClienteClick={(id, name) => setSelectedCliente({ id, name })}
          />
          
          <RankingVendedores
            data={(metrics?.topVendedores || []).map(v => ({ ...v, orderCount: v.orderCount || 0 }))}
            isLoading={isLoading}
          />
       </div>
        
        {/* Gestión */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ClientesSinAsignar />
          <GestionClientes />
        </div>
        
        {/* Visión Rayos X */}
        {storeId && <VisionRayosX storeId={storeId} />}
        
        {/* Modal Detalle Cliente */}
        {selectedCliente && (
          <ModalDetalleCliente
            clienteId={selectedCliente.id}
            clienteName={selectedCliente.name}
            onClose={() => setSelectedCliente(null)}
          />
        )}
      </div>
    </div>
  )
}
