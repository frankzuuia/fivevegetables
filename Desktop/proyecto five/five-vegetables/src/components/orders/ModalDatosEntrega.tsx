// =====================================================
// COMPONENT: Modal Datos Entrega
// Captura dirección completa para snapshot en order
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { z } from 'zod'
import { X } from 'lucide-react'

const DeliveryDataSchema = z.object({
  contactName: z.string().min(1, 'Nombre requerido'),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe ser 10 dígitos'),
  restaurant: z.string().min(1, 'Nombre del restaurant requerido'),
  street: z.string().min(1, 'Calle requerida'),
  colonia: z.string().min(1, 'Colonia requerida'),
  codigoPostal: z.string().regex(/^\d{5}$/, 'CP debe ser 5 dígitos'),
  referencias: z.string().optional(),
  requestInvoice: z.boolean().default(false),
})

export type DeliveryData = z.infer<typeof DeliveryDataSchema>

interface ModalDatosEntregaProps {
  onConfirm: (data: DeliveryData) => void
  onClose: () => void
  defaultData?: Partial<DeliveryData>
}

export function ModalDatosEntrega({
  onConfirm,
  onClose,
  defaultData,
}: ModalDatosEntregaProps) {
  const [formData, setFormData] = useState<DeliveryData>({
    contactName: defaultData?.contactName || '',
    phone: defaultData?.phone || '',
    restaurant: defaultData?.restaurant || '',
    street: defaultData?.street || '',
    colonia: defaultData?.colonia || '',
    codigoPostal: defaultData?.codigoPostal || '',
    referencias: defaultData?.referencias || '',
    requestInvoice: defaultData?.requestInvoice || false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleSubmit = () => {
    try {
      const validated = DeliveryDataSchema.parse(formData)
      onConfirm(validated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const field = issue.path[0] as string
          newErrors[field] = issue.message
        })
        setErrors(newErrors)
      }
    }
  }
  
  const updateField = (field: keyof DeliveryData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }
  
  return (
    <Modal isOpen={true} size="lg" onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-morph-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              Datos de Entrega
            </h2>
            <p className="mt-1 text-sm text-morph-gray-600">
              Confirma la dirección donde recibirás tu pedido
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-morph-gray-100"
          >
            <X className="h-5 w-5 text-morph-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
          {/* Sección Contacto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-morph-gray-800">
              📱 Información de Contacto
            </h3>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Nombre de Contacto *
              </label>
              <Input
                value={formData.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                placeholder="Ej: Juan Pérez"
                error={errors.contactName}
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Teléfono (10 dígitos) *
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="3312345678"
                maxLength={10}
                error={errors.phone}
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Nombre del Restaurant *
              </label>
              <Input
                value={formData.restaurant}
                onChange={(e) => updateField('restaurant', e.target.value)}
                placeholder="Ej: Restaurant El Buen Sabor"
                error={errors.restaurant}
              />
            </div>
          </div>
          
          {/* Sección Dirección */}
          <div className="space-y-4">
            <h3 className="font-semibold text-morph-gray-800">
              📍 Dirección de Entrega
            </h3>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Calle *
              </label>
              <Input
                value={formData.street}
                onChange={(e) => updateField('street', e.target.value)}
                placeholder="Ej: Av. Juárez 123"
                error={errors.street}
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Colonia *
                </label>
                <Input
                  value={formData.colonia}
                  onChange={(e) => updateField('colonia', e.target.value)}
                  placeholder="Ej: Centro"
                  error={errors.colonia}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Código Postal (5 dígitos) *
                </label>
                <Input
                  value={formData.codigoPostal}
                  onChange={(e) => updateField('codigoPostal', e.target.value)}
                  placeholder="44100"
                  maxLength={5}
                  error={errors.codigoPostal}
                />
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Referencias (opcional)
              </label>
              <textarea
                value={formData.referencias}
                onChange={(e) => updateField('referencias', e.target.value)}
                placeholder="Ej: Entre calle 5 de Mayo y Morelos, portón verde"
                rows={3}
                className="w-full rounded-lg border border-morph-gray-300 bg-white px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-morph-primary-500"
              />
            </div>
          </div>
          
          {/* Factura */}
          <div className="rounded-lg bg-morph-gray-50 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requestInvoice}
                onChange={(e) => updateField('requestInvoice', e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-morph-gray-300 text-morph-primary-600 focus:ring-2 focus:ring-morph-primary-500"
              />
              <div>
                <span className="font-medium text-morph-gray-900">
                  Solicitar Factura
                </span>
                <p className="mt-1 text-sm text-morph-gray-600">
                  Recibirás un formulario para capturar tus datos fiscales después de la entrega
                </p>
              </div>
            </label>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 border-t border-morph-gray-200 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="flex-1">
            Confirmar Pedido
          </Button>
        </div>
      </div>
    </Modal>
  )
}
