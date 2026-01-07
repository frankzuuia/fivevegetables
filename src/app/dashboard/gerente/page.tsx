// =====================================================
// PAGE: Dashboard Gerente
// Vista principal con métricas, rankings y gestión
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGerenteMetrics } from '@/lib/hooks/useMetrics'
import { MetricCard } from '@/components/ui/MetricCard'
import { AdvancedFilterBar, type FilterState } from '@/components/ui/AdvancedFilterBar'
import { ModalSelectorDia } from '@/components/ui/ModalSelectorDia'
import { ModalSelectorMes } from '@/components/ui/ModalSelectorMes'
import { RankingClientes } from '@/components/gerente/RankingClientes'
import { RankingVendedores } from '@/components/gerente/RankingVendedores'
import { ClientesSinAsignar } from '@/components/gerente/ClientesSinAsignar'
import { GestionClientes } from '@/components/gerente/GestionClientes'
import { VisionRayosX } from '@/components/gerente/VisionRayosX'
import { ModalDetalleCliente } from '@/components/gerente/ModalDetalleCliente'
import { ModalIngresosDetalle } from '@/components/gerente/ModalIngresosDetalle'
import { ModalPedidosDetalle } from '@/components/gerente/ModalPedidosDetalle'
import { ModalTicketPromedioDetalle } from '@/components/gerente/ModalTicketPromedioDetalle'
import { ModalClientesNuevos } from '@/components/gerente/ModalClientesNuevos'
import { ModalRankingClientesCompleto } from '@/components/gerente/ModalRankingClientesCompleto'
import { ModalRankingVendedoresCompleto } from '@/components/gerente/ModalRankingVendedoresCompleto'
import type { ModalFilterState } from '@/components/ui/ModalFilterBar'
import type { QuickFilter } from '@/components/ui/CompactFilterBar'
import { SyncProductsButton } from '@/components/gerente/SyncProductsButton'
import { CrearVendedorButton } from '@/components/gerente/CrearVendedorButton'
import { ListaUsuariosPINs } from '@/components/gerente/ListaUsuariosPINs'
import { GestorListasPrecios } from '@/components/gerente/GestorListasPrecios'
import { GestionProductos } from '@/components/gerente/GestionProductos'
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { startOfDay, endOfDay } from 'date-fns'

export default function DashboardGerentePage() {
  const supabase = createClient()
  
  // Get store_id del usuario autenticado
  const [storeId, setStoreId] = useState<string>('')
  
  // Modal detalle cliente
  const [selectedCliente, setSelectedCliente] = useState<{ id: string; name: string } | null>(null)
  
  // Analytics modals state
  const [ingresosModalOpen, setIngresosModalOpen] = useState(false)
  const [pedidosModalOpen, setPedidosModalOpen] = useState(false)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [clientesNuevosModalOpen, setClientesNuevosModalOpen] = useState(false)
  
  // Ranking modals state
  const [rankingClientesModalOpen, setRankingClientesModalOpen] = useState(false)
  const [rankingVendedoresModalOpen, setRankingVendedoresModalOpen] = useState(false)
  
  // Advanced Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    activeType: 'quick',
    quickFilter: 'hoy',
    specificDay: null,
    specificMonth: null,
    dateRange: {
      from: startOfDay(new Date()),
      to: endOfDay(new Date())
    }
  })
  
  // Filter modals for main dashboard
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [monthModalOpen, setMonthModalOpen] = useState(false)
  
  // Simple filters for ranking modals
  const [rankingClientesFilter, setRankingClientesFilter] = useState<QuickFilter>('hoy')
  const [rankingVendedoresFilter, setRankingVendedoresFilter] = useState<QuickFilter>('hoy')
  
  // Legacy filter for backward compatibility with useGerenteMetrics
  const legacyFilter: 'hoy' | 'mes' = filterState.quickFilter === 'mes' || filterState.quickFilter === 'año' ? 'mes' : 'hoy'
  
  // Get date range based on filter state
  const getAnalyticsDateRange = () => {
    return {
      from: filterState.dateRange.from.toISOString(),
      to: filterState.dateRange.to.toISOString()
    }
  }
  
  // Handler for day selection
  const handleDaySelect = (day: Date) => {
    const from = new Date(day.setHours(0, 0, 0, 0))
    const to = new Date(day.setHours(23, 59, 59, 999))
    
    setFilterState(prev => ({
      ...prev,  // Preserve all previous values
      activeType: 'specificDay',
      quickFilter: null,
      specificDay: day,
      dateRange: { from, to }
    }))
  }
  
  // Handler for month selection
  const handleMonthSelect = (month: number, year: number) => {
    const from = new Date(year, month, 1, 0, 0, 0, 0)
    const to = new Date(year, month + 1, 0, 23, 59, 59, 999)
    
    setFilterState(prev => ({
      ...prev,  // Preserve all previous values
      activeType: 'specificMonth',
      quickFilter: null,
      specificMonth: { month, year },
      dateRange: { from, to }
    }))
  }
  
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
  
  const { data: metrics, isLoading } = useGerenteMetrics(storeId, legacyFilter)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-morph-primary-50 to-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-morph-gray-900">
              Dashboard Gerente
            </h1>
            <p className="mt-2 text-morph-gray-600">
              Vista general del negocio y gestión de equipos
            </p>
          </div>
          
          <div className="sm:ml-auto">
            <AdvancedFilterBar
              filterState={filterState}
              onFilterChange={setFilterState}
              onOpenDayModal={() => setDayModalOpen(true)}
              onOpenMonthModal={() => setMonthModalOpen(true)}
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
            onDrillDown={() => setIngresosModalOpen(true)}
          />
          
          <MetricCard
            title="Total Pedidos"
            value={metrics?.totalOrders?.toString() || '0'}
            icon={ShoppingCart}
            onDrillDown={() => setPedidosModalOpen(true)}
          />
          
          <MetricCard
            title="Ticket Promedio"
            value={`$${(metrics?.averageOrderValue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            onDrillDown={() => setTicketModalOpen(true)}
          />
          
          <MetricCard
            title="Clientes Nuevos"
            value={metrics?.totalOrders?.toString() || '0'}
            icon={Users}
            onDrillDown={() => setClientesNuevosModalOpen(true)}
          />
        </div>
        
        {/* Herramientas Administrativas */}
        <div className="rounded-lg border border-morph-gray-200 bg-white p-6 shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-morph-gray-900">
              🛠️ Herramientas Administrativas
            </h2>
            <p className="mt-1 text-sm text-morph-gray-600">
              Gestión y sincronización de datos con Odoo
            </p>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
            <SyncProductsButton />
            <CrearVendedorButton />
            <p className="text-sm text-morph-gray-500 w-full sm:w-auto">
              Sincroniza automáticamente cada 5 minutos
            </p>
          </div>
        </div>
        
        {/* Lista de Usuarios con PINs */}
        <ListaUsuariosPINs />
        
        {/* Rankings */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RankingClientes
            data={metrics?.topClients || []}
            isLoading={isLoading}
            onClienteClick={(id, name) => setSelectedCliente({ id, name })}
            onViewAll={() => setRankingClientesModalOpen(true)}
          />
          
          <RankingVendedores
            data={(metrics?.topVendedores || []).map(v => ({ ...v, orderCount: v.orderCount || 0 }))}
            isLoading={isLoading}
            onViewAll={() => setRankingVendedoresModalOpen(true)}
          />
       </div>
        
        {/* Gestión */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ClientesSinAsignar />
          <GestionClientes />
        </div>
        
        {/* Visión Rayos X */}
        {storeId && <VisionRayosX storeId={storeId} />}

        {/* Gestor de Listas de Precios */}
        <GestorListasPrecios />

        {/* Gestor de Productos */}
        <GestionProductos />
        
        {/* Modal Detalle Cliente */}
        {selectedCliente && (
          <ModalDetalleCliente
            clienteId={selectedCliente.id}
            clienteName={selectedCliente.name}
            onClose={() => setSelectedCliente(null)}
          />
        )}
        
        {/* Analytics Modals */}
        {storeId && (
          <>
            <ModalIngresosDetalle
              isOpen={ingresosModalOpen}
              onClose={() => setIngresosModalOpen(false)}
              storeId={storeId}
              initialDateRange={getAnalyticsDateRange()}
            />
            
            <ModalPedidosDetalle
              isOpen={pedidosModalOpen}
              onClose={() => setPedidosModalOpen(false)}
              storeId={storeId}
            />
            
            <ModalTicketPromedioDetalle
              isOpen={ticketModalOpen}
              onClose={() => setTicketModalOpen(false)}
              storeId={storeId}
            />
            
            <ModalClientesNuevos
              isOpen={clientesNuevosModalOpen}
              onClose={() => setClientesNuevosModalOpen(false)}
              storeId={storeId}
              onClientClick={(id, name) => {
                setClientesNuevosModalOpen(false)
                setSelectedCliente({ id, name })
              }}
            />
          </>
        )}
        
        {/* Ranking Modals */}
        <ModalRankingClientesCompleto
          isOpen={rankingClientesModalOpen}
          onClose={() => setRankingClientesModalOpen(false)}
          clientes={metrics?.topClients || []}
          currentFilter={rankingClientesFilter}
          onFilterChange={setRankingClientesFilter}
        />
        
        <ModalRankingVendedoresCompleto
          isOpen={rankingVendedoresModalOpen}
          onClose={() => setRankingVendedoresModalOpen(false)}
          vendedores={(metrics?.topVendedores || []).map(v => ({ ...v, orderCount: v.orderCount || 0 }))}
          currentFilter={rankingVendedoresFilter}
          onFilterChange={setRankingVendedoresFilter}
        />
        
        {/* Filter Modals */}
        <ModalSelectorDia
          isOpen={dayModalOpen}
          onClose={() => setDayModalOpen(false)}
          onSelectDay={handleDaySelect}
          currentDay={filterState.specificDay}
        />
        
        <ModalSelectorMes
          isOpen={monthModalOpen}
          onClose={() => setMonthModalOpen(false)}
          onSelectMonth={handleMonthSelect}
          currentMonth={filterState.specificMonth}
        />
      </div>
    </div>
  )
}
