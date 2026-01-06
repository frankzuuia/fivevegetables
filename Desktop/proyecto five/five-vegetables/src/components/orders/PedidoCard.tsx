// =====================================================
// COMPONENT: Pedido Card
// Card individual mostrando estado + acciones
// =====================================================

'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Package, Eye, CheckCircle, FileText } from 'lucide-react'

type OrderStatus = 'draft' | 'confirmed' | 'received' | 'delivered' | 'cancelled'
type InvoiceStatus = 'no' | 'to_invoice' | 'invoiced'

interface PedidoCardProps {
  pedido: {
    id: string
    order_number: string
    status: OrderStatus
    invoice_status: InvoiceStatus
    total: number
    created_at: string
    delivered_at?: string
    cliente_name?: string // Para vendedor
    vendedor_name?: string // Para cliente
  }
  onViewDetails?: () => void
  onMarcarRecibido?: () => void
  onMarcarEntregado?: () => void
  onSolicitarFactura?: () => void
  onRepetirPedido?: () => void
  userRole: 'cliente' | 'vendedor' | 'gerente'
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: '📝' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: '✅' },
  received: { label: 'Recibido', color: 'bg-purple-100 text-purple-700', icon: '📦' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: '🚚' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: '❌' },
}

const INVOICE_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  no: { label: 'Sin factura', color: 'bg-gray-100 text-gray-600' },
  to_invoice: { label: 'Pendiente factura', color: 'bg-yellow-100 text-yellow-700' },
  invoiced: { label: 'Facturado', color: 'bg-green-100 text-green-700' },
}

export function PedidoCard({
  pedido,
  onViewDetails,
  onMarcarRecibido,
  onMarcarEntregado,
  onSolicitarFactura,
  onRepetirPedido,
  userRole,
}: PedidoCardProps) {
  const statusConfig = STATUS_CONFIG[pedido.status]
  const invoiceConfig = INVOICE_CONFIG[pedido.invoice_status]
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  
  return (
    <Card variant="elevated" className="overflow-hidden transition-all hover:shadow-lg">
      {/* Header con número de pedido */}
      <div className="flex items-center justify-between border-b border-morph-border bg-gradient-to-r from-morph-primary-50 to-morph-primary-100 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-morph-primary-600" />
            <h3 className="text-lg font-bold text-morph-gray-900">
              {pedido.order_number}
            </h3>
          </div>
          {userRole === 'vendedor' && pedido.cliente_name && (
            <p className="mt-1 text-sm text-morph-gray-600">
              Cliente: {pedido.cliente_name}
            </p>
          )}
          {userRole === 'cliente' && pedido.vendedor_name && (
            <p className="mt-1 text-sm text-morph-gray-600">
              Vendedor: {pedido.vendedor_name}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-morph-primary-700">
            {formatCurrency(pedido.total)}
          </p>
          <p className="text-xs text-morph-gray-500">
            {formatDate(pedido.created_at)}
          </p>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="p-4">
        {/* Badges de estado */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${statusConfig.color}`}
          >
            <span>{statusConfig.icon}</span>
            {statusConfig.label}
          </span>
          
          {pedido.invoice_status !== 'no' && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${invoiceConfig.color}`}
            >
              <FileText className="h-3 w-3" />
              {invoiceConfig.label}
            </span>
          )}
        </div>
        
        {/* Fechas importantes */}
        {pedido.delivered_at && (
          <p className="mb-3 text-sm text-morph-gray-600">
            🚚 Entregado: {formatDate(pedido.delivered_at)}
          </p>
        )}
        
        {/* Acciones según rol y estado */}
        <div className="flex flex-wrap gap-2">
          {/* Ver detalles (todos) */}
          {onViewDetails && (
            <Button onClick={onViewDetails} size="sm" variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </Button>
          )}
          
          {/* Cliente: Marcar recibido */}
          {userRole === 'cliente' &&
            pedido.status === 'confirmed' &&
            onMarcarRecibido && (
              <Button onClick={onMarcarRecibido} size="sm" variant="primary">
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Recibido
              </Button>
            )}
          
          {/* Vendedor: Marcar entregado */}
          {userRole === 'vendedor' &&
            pedido.status === 'received' &&
            onMarcarEntregado && (
              <Button onClick={onMarcarEntregado} size="sm" variant="primary">
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Entregado
              </Button>
            )}
          
          {/* Solicitar factura (delivered + no invoiced) */}
          {pedido.status === 'delivered' &&
            pedido.invoice_status === 'no' &&
            onSolicitarFactura && (
              <Button onClick={onSolicitarFactura} size="sm" variant="primary">
                <FileText className="mr-2 h-4 w-4" />
                Solicitar Factura
              </Button>
            )}
          
          {/* Descargar PDF factura (invoiced only) - MOCKUP */}
          {pedido.invoice_status === 'invoiced' && (
            <Button 
              onClick={() => {
                const { toast } = require('sonner');
                toast.info('📄 PDF de factura disponible próximamente');
              }}
              size="sm" 
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          )}
          
          {/* Repetir Pedido (cliente + delivered/received) */}
          {userRole === 'cliente' &&
            (pedido.status === 'delivered' || pedido.status === 'received') &&
            onRepetirPedido && (
              <Button onClick={onRepetirPedido} size="sm" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Repetir Pedido
              </Button>
            )}
        </div>
      </div>
    </Card>
  )
}
