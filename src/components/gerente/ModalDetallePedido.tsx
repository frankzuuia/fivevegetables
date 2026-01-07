// =====================================================
// MODAL: Detalle de Pedido Individual
// Nested modal showing complete order information
// =====================================================

'use client'

import { Modal } from '@/components/ui/Modal'
import { useOrderDetail } from '@/lib/hooks/useAnalytics'
import { Package, User, MapPin, FileText, Phone, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}

export function ModalDetallePedido({ isOpen, onClose, orderId }: Props) {
  const { data: order, isLoading } = useOrderDetail(orderId)

  if (!isOpen || !orderId) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pedido ${order?.order.orderNumber || '...'}`}
      size="lg"
      className="max-h-[85vh] flex flex-col"
    >
      <div className="overflow-y-auto flex-1 space-y-6 pr-2">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morph-primary-600"></div>
          </div>
        )}

        {order && (
          <>
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-600">Fecha</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {format(new Date(order.order.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-600">Total</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  ${order.order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-gray-600">Estado</span>
                </div>
                <p className="text-sm font-bold text-gray-900 capitalize">{order.order.status}</p>
              </div>
            </div>

            {/* Cliente Info */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-morph-primary-600" />
                <h3 className="font-bold text-gray-900">Cliente</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold">Nombre:</span> {order.cliente.name}</p>
                {order.cliente.phone && (
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {order.cliente.phone}
                  </p>
                )}
                {order.cliente.address.street && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{order.cliente.address.street} {order.cliente.address.numeroExterior}</p>
                      <p className="text-gray-500">
                        {order.cliente.address.colonia}, {order.cliente.address.ciudad}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vendedor */}
            {order.vendedor.id && (
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">Vendedor Asignado</h3>
                <p className="text-sm">{order.vendedor.name}</p>
                {order.vendedor.phone && <p className="text-sm text-gray-500">{order.vendedor.phone}</p>}
              </div>
            )}

            {/* Items Table */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Productos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Producto</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-700">Cantidad</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-700">Precio Unit.</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">Subtotal:</td>
                      <td className="px-4 py-3 text-right">${order.order.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">IVA:</td>
                      <td className="px-4 py-3 text-right">${order.order.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan={3} className="px-4 py-3 text-right">Total:</td>
                      <td className="px-4 py-3 text-right text-green-600">${order.order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes if any */}
            {order.order.notes && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">Notas</h4>
                <p className="text-sm text-gray-700">{order.order.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
