'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BottomNavItem {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
}

export interface BottomNavProps {
  items: BottomNavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname()
  
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t border-morph-border bg-white shadow-morph-lg md:hidden',
      className
    )}>
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-morph-primary-600'
                  : 'text-morph-gray-600 hover:text-morph-gray-900'
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-morph-error px-1 text-xs font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-bold'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-morph-primary-600" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
