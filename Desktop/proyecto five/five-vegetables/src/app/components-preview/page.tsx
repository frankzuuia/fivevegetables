'use client'

import { useState } from 'react'
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SearchBar } from '@/components/ui/SearchBar'
import { MetricCard } from '@/components/ui/MetricCard'
import { FilterAccordion, FilterOption } from '@/components/ui/FilterAccordion'
import { FloatingCart } from '@/components/ui/FloatingCart'
import { Drawer } from '@/components/ui/Drawer'
import { Modal, ModalFooter } from '@/components/ui/Modal'

export default function ComponentsPreviewPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('hoy')
  const [cartCount, setCartCount] = useState(3)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-morph-bg p-8">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold text-morph-gray-900">
            Componentes Premium - Five Vegetables
          </h1>
          <p className="mt-2 text-morph-gray-600">
            Sistema de diseño morphysm verde/blanco con micro-animations
          </p>
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Botones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="primary" size="lg">Large Button</Button>
              <Button variant="primary" size="sm">Small Button</Button>
              <Button variant="primary" isLoading>Loading...</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <Input label="Email" type="email" placeholder="tu@email.com" />
              <Input label="Contraseña" type="password" placeholder="••••••••" />
              <Input 
                label="Con Error" 
                placeholder="Campo inválido" 
                error="Este campo es requerido"
              />
              <Input 
                label="Con Helper Text" 
                placeholder="Texto de ayuda"
                helperText="Ingresa tu nombre completo"
              />
            </div>
            <div className="mt-6">
              <SearchBar
                placeholder="Buscar productos..."
                onSearch={(query) => setSearchQuery(query)}
              />
              {searchQuery && (
                <p className="mt-2 text-sm text-morph-gray-600">
                  Buscando: <strong>{searchQuery}</strong>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Ventas Totales"
            value="$125,430"
            subtitle="Último mes"
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            onDrillDown={() => setIsModalOpen(true)}
          />
          <MetricCard
            title="Pedidos"
            value="342"
            subtitle="Pendientes: 23"
            icon={Package}
            trend={{ value: -5.2, isPositive: false }}
            onDrillDown={() => setIsModalOpen(true)}
          />
          <MetricCard
            title="Clientes Activos"
            value="128"
            subtitle="Este mes"
            icon={Users}
            trend={{ value: 8.1, isPositive: true }}
          />
          <MetricCard
            title="Crecimiento"
            value="+18%"
            subtitle="vs. mes anterior"
            icon={TrendingUp}
          />
        </div>

        {/* Filter Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros Profesionales</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterAccordion
              onFilterChange={(filter) => setSelectedFilter(filter)}
              defaultFilter="hoy"
            />
            <p className="mt-4 text-sm text-morph-gray-600">
              Filtro seleccionado: <strong className="capitalize">{selectedFilter}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Modal & Drawer Triggers */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Modal Drill-Down</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsModalOpen(true)}>Abrir Modal</Button>
              <p className="mt-4 text-sm text-morph-gray-600">
                Modal con glassmorphism, 5 tamaños, backdrop blur
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drawer Animated</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsDrawerOpen(true)}>Abrir Drawer</Button>
              <p className="mt-4 text-sm text-morph-gray-600">
                Drawer con 3 posiciones, ESC key, swipe-to-close
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Cart (always visible) */}
      <FloatingCart
        itemCount={cartCount}
        onCartClick={() => {
          alert(`Carrito abierto - ${cartCount} items`)
          setCartCount(prev => prev + 1)
        }}
      />

      {/* Drawer Example */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Mi Carrito"
        position="right"
      >
        <div className="space-y-4">
          <p className="text-morph-gray-700">Contenido del drawer con scroll automático</p>
          {[...Array(20)].map((_, i) => (
            <Card key={i} className="p-4">
              <p>Producto {i + 1}</p>
            </Card>
          ))}
        </div>
      </Drawer>

      {/* Modal Example */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Métrica - Ventas"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-heading text-xl font-bold text-morph-gray-900">
              Análisis Detallado
            </h3>
            <p className="mt-2 text-morph-gray-700">
              Aquí se mostrarían gráficas, tablas y filtros avanzados para drill-down en la métrica
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-morph-gray-600">Promedio diario</p>
              <p className="mt-1 font-heading text-2xl font-bold text-morph-primary-600">
                $4,181
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-morph-gray-600">Mejor día</p>
              <p className="mt-1 font-heading text-2xl font-bold text-morph-success">
                $12,450
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-morph-gray-600">Total</p>
              <p className="mt-1 font-heading text-2xl font-bold text-morph-gray-900">
                $125,430
              </p>
            </Card>
          </div>
        </div>
        
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </Button>
          <Button variant="primary">Exportar Datos</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
