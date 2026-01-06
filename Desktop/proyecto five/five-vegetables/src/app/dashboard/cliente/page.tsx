// =====================================================
// PAGE: Dashboard Cliente
// Main page view state Uber Eats style (Dashboard Cliente)
// =====================================================

'use client'

import { useState } from 'react'
import { useCart } from '@/lib/hooks/useCart'
import { BottomNav, type BottomNavItem } from '@/components/ui/BottomNav'
import { CatalogoCliente } from '@/components/cliente/CatalogoCliente'
import { Carrito } from '@/components/cliente/Carrito'
import { MisPedidos } from '@/components/orders/MisPedidos'
import { PerfilCliente } from '@/components/cliente/PerfilCliente'
import { WhatsAppFloating } from '@/components/cliente/WhatsAppFloating'
import { Store, ShoppingCart, List, User } from 'lucide-react'

export default function DashboardClientePage() {
  const [view, setView] = useState<'catalogo' | 'carrito' | 'pedidos' | 'perfil'>('catalogo')
  const { itemCount } = useCart()
  
  // BottomNav items config
  const navItems: BottomNavItem[] = [
    {
      href: '#catalogo',
      icon: Store,
      label: 'Catálogo',
      badge: undefined,
    },
    {
      href: '#carrito',
      icon: ShoppingCart,
      label: 'Carrito',
      badge: itemCount,
    },
    {
      href: '#pedidos',
      icon: List,
      label: 'Mis Pedidos',
      badge: undefined,
    },
    {
      href: '#perfil',
      icon: User,
      label: 'Perfil',
      badge: undefined,
    },
  ]
  
  // Navigate on click (prevent default Link behavior, use view state instead)
  const handleNavClick = (href: string) => {
    const viewName = href.replace('#', '') as typeof view
    setView(viewName)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-morph-primary-50 to-white pb-20">
      <div className="mx-auto max-w-7xl p-6">
        {/* Render current view */}
        {view === 'catalogo' && <CatalogoCliente />}
        {view === 'carrito' && <Carrito />}
        {view === 'pedidos' && <MisPedidos />}
        {view === 'perfil' && <PerfilCliente />}
      </div>
      
      {/* BottomNav Uber Eats Style */}
      <div onClick={(e) => {
        const target = e.target as HTMLElement
        const link = target.closest('a')
        if (link) {
          e.preventDefault()
          handleNavClick(link.getAttribute('href') || '')
        }
      }}>
        <BottomNav items={navItems} />
      </div>
      
      {/* WhatsApp Floating - Always visible */}
      <WhatsAppFloating />
    </div>
  )
}
