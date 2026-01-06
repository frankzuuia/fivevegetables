// =====================================================
// PAGE: Dashboard Vendedor
// Vista principal vendedor estilo Uber Eats + Morphysm (Dashboard Vendedor)
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVendedorMetrics } from '@/lib/hooks/useMetrics'
import { MetricCard } from '@/components/ui/MetricCard'
import { FilterAccordion, type FilterOption } from '@/components/ui/FilterAccordion'
import { ClienteEstrella } from '@/components/vendedor/ClienteEstrella'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardVendedorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [filter, setFilter] = useState<FilterOption>('hoy')
  
  const { data: metrics, isLoading } = useVendedorMetrics(filter)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-morph-primary-50 to-white p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-morph-gray-900">
              Dashboard Vendedor
            </h1>
            <p className="mt-2 text-morph-gray-600">
              Tus métricas de ventas y cartera de clientes
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
            title="Mis Ventas"
            value={`$${(metrics?.mySales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend={metrics?.trend || undefined}
          />
          
          <MetricCard
            title="Mis Pedidos"
            value={metrics?.myOrders?.toString() || '0'}
            icon={ShoppingCart}
          />
          
          <MetricCard
            title="Mis Clientes"
            value={metrics?.myClientCount?.toString() || '0'}
            icon={Users}
          />
          
          <MetricCard
            title="Ticket Promedio"
            value={metrics?.myOrders && metrics.myOrders > 0
              ? `$${(metrics.mySales / metrics.myOrders).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
              : '$0.00'
            }
            icon={TrendingUp}
          />
        </div>
        
        {/* Cliente Estrella */}
        <ClienteEstrella
          cliente={metrics?.topClient || null}
          loading={isLoading}
        />
        
        {/* Botones de Acción */}
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push('/dashboard/vendedor/cartera')}
            className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-left font-medium text-white shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">💼 Mi Cartera</p>
                <p className="mt-1 text-sm text-green-100">
                  Ver todos mis clientes ({metrics?.myClientCount || 0})
                </p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </button>
          
          <button
            onClick={() => router.push('/dashboard/vendedor/pedidos')}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-left font-medium text-white shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">📦 Mis Pedidos</p>
                <p className="mt-1 text-sm text-blue-100">
                  Gestionar pedidos activos
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-200" />
            </div>
          </button>
        </div>
        
        {/* Info Card Sync */}
        <div className="rounded-lg border border-morph-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-morph-primary-100 p-3">
              <TrendingUp className="h-6 w-6 text-morph-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-morph-gray-900">
                💡 Tip del Día
              </h3>
              <p className="mt-1 text-sm text-morph-gray-600">
                Usa el <strong>Control Remoto de Precios</strong> desde Mi Cartera para cambiar
                la tarifa de un cliente al instante. ¡Los clientes verán los nuevos precios
                inmediatamente!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
