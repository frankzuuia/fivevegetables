'use client'

import { HTMLAttributes, ReactNode } from 'react'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  onDrillDown?: () => void
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onDrillDown,
  className,
  ...props
}: MetricCardProps) {
  const isClickable = Boolean(onDrillDown)
  
  return (
    <Card
      variant="elevated"
      clickable={isClickable}
      onClick={onDrillDown}
      className={cn('group relative overflow-hidden', className)}
      {...props}
    >
      {/* Icon Background Decoration */}
      {Icon && (
        <div className="absolute -right-4 -top-4 opacity-5 transition-all group-hover:opacity-10">
          <Icon className="h-32 w-32" />
        </div>
      )}
      
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-morph-gray-600">{title}</p>
          </div>
          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-morph-primary-100 transition-all group-hover:scale-110">
              <Icon className="h-6 w-6 text-morph-primary-600" />
            </div>
          )}
        </div>
        
        {/* Value */}
        <div>
          <h3 className="font-heading text-3xl font-bold text-morph-gray-900">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm text-morph-gray-500">{subtitle}</p>
          )}
        </div>
        
        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-morph-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-morph-error" />
            )}
            <span className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-morph-success' : 'text-morph-error'
            )}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-sm text-morph-gray-500">vs. anterior</span>
          </div>
        )}
        
        {/* Click Indicator */}
        {isClickable && (
          <div className="absolute bottom-2 right-2 text-morph-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </Card>
  )
}
