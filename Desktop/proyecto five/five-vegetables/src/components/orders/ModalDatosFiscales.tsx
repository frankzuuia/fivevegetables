// =====================================================
// COMPONENT: Modal Datos Fiscales
// Cliente/Vendedor ingresa datos para generar CFDI
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSolicitarFactura } from '@/lib/hooks/useInvoices'
import { toast } from 'sonner'

interface ModalDatosFiscalesProps {
  pedidoId: string
  onClose: () => void
}

// Catálogo SAT - Regímenes Fiscales más comunes
const REGIMENES_FISCALES = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '621', label: '621 - Incorporación Fiscal' },
]

// Catálogo SAT - Usos de CFDI más comunes
const USOS_CFDI = [
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'P01', label: 'P01 - Por definir' },
]

export function ModalDatosFiscales({
  pedidoId,
  onClose,
}: ModalDatosFiscalesProps) {
  const [formData, setFormData] = useState({
    rfc: '',
    razonSocial: '',
    regimenFiscal: '',
    codigoPostal: '',
    usoCFDI: 'G01', // Default: Adquisición de mercancías
    email: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const solicitarMutation = useSolicitarFactura()
  
  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    // Validar RFC (13 dígitos empresas, 12 personas físicas)
    if (!formData.rfc || !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(formData.rfc)) {
      newErrors.rfc = 'RFC inválido (Ej: ABC123456XXX)'
    }
    
    if (!formData.razonSocial) {
      newErrors.razonSocial = 'Requerido'
    }
    
    if (!formData.regimenFiscal) {
      newErrors.regimenFiscal = 'Seleccione un régimen fiscal'
    }
    
    if (!formData.codigoPostal || !/^\d{5}$/.test(formData.codigoPostal)) {
      newErrors.codigoPostal = 'CP debe tener 5 dígitos'
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    return newErrors
  }
  
  const handleSubmit = async () => {
    const validationErrors = validate()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Por favor corrige los errores')
      return
    }
    
    try {
      const result = await solicitarMutation.mutateAsync({
        pedidoId,
        datosFiscales: formData,
      })
      
      if (result.invoiceUrl) {
        toast.success('Factura generada correctamente')
        toast.info('Recibirás la factura en tu email')
      } else {
        toast.success('Factura solicitada. La recibirás pronto en tu email.')
      }
      
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al generar factura'
      )
    }
  }
  
  return (
    <Modal isOpen onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-morph-gray-900">
            Datos para Factura Electrónica (CFDI)
          </h2>
          <p className="mt-2 text-sm text-morph-gray-600">
            Por favor completa los siguientes datos fiscales para generar tu factura
          </p>
        </div>
        
        {/* Form */}
        <div className="space-y-4">
          {/* RFC */}
          <div>
            <label className="block text-sm font-medium text-morph-gray-700 mb-2">
              RFC *
            </label>
            <Input
              value={formData.rfc}
              onChange={(e) => {
                setFormData({ ...formData, rfc: e.target.value.toUpperCase() })
                setErrors({ ...errors, rfc: '' })
              }}
              placeholder="ABC123456XXX"
              maxLength={13}
              error={errors.rfc}
            />
            {errors.rfc && (
              <p className="mt-1 text-sm text-red-600">{errors.rfc}</p>
            )}
          </div>
          
          {/* Razón Social */}
          <div>
            <label className="block text-sm font-medium text-morph-gray-700 mb-2">
              Razón Social *
            </label>
            <Input
              value={formData.razonSocial}
              onChange={(e) => {
                setFormData({ ...formData, razonSocial: e.target.value })
                setErrors({ ...errors, razonSocial: '' })
              }}
              placeholder="Nombre fiscal de la empresa"
              error={errors.razonSocial}
            />
            {errors.razonSocial && (
              <p className="mt-1 text-sm text-red-600">{errors.razonSocial}</p>
            )}
          </div>
          
          {/* Régimen Fiscal */}
          <div>
            <label className="block text-sm font-medium text-morph-gray-700 mb-2">
              Régimen Fiscal *
            </label>
            <select
              value={formData.regimenFiscal}
              onChange={(e) => {
                setFormData({ ...formData, regimenFiscal: e.target.value })
                setErrors({ ...errors, regimenFiscal: '' })
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-morph-primary-500 focus:border-transparent transition-all ${
                errors.regimenFiscal ? 'border-red-500' : 'border-morph-gray-300'
              }`}
            >
              <option value="">Seleccionar...</option>
              {REGIMENES_FISCALES.map((regimen) => (
                <option key={regimen.value} value={regimen.value}>
                  {regimen.label}
                </option>
              ))}
            </select>
            {errors.regimenFiscal && (
              <p className="mt-1 text-sm text-red-600">{errors.regimenFiscal}</p>
            )}
          </div>
          
          {/* Código Postal */}
          <div>
            <label className="block text-sm font-medium text-morph-gray-700 mb-2">
              Código Postal *
            </label>
            <Input
              value={formData.codigoPostal}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  codigoPostal: e.target.value.replace(/\D/g, ''),
                })
                setErrors({ ...errors, codigoPostal: '' })
              }}
              placeholder="12345"
              maxLength={5}
              error={errors.codigoPostal}
            />
            {errors.codigoPostal && (
              <p className="mt-1 text-sm text-red-600">{errors.codigoPostal}</p>
            )}
          </div>
          
          {/* Uso de CFDI */}
          <div>
            <label className="block text-sm font-medium text-morph-gray-700 mb-2">
              Uso de CFDI *
            </label>
            <select
              value={formData.usoCFDI}
              onChange={(e) =>
                setFormData({ ...formData, usoCFDI: e.target.value })
              }
              className="w-full px-4 py-3 border border-morph-gray-300 rounded-lg focus:ring-2 focus:ring-morph-primary-500 focus:border-transparent transition-all"
            >
              {USOS_CFDI.map((uso) => (
                <option key={uso.value} value={uso.value}>
                  {uso.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-morph-gray-700 mb-2">
              Email (para recibir CFDI) *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setErrors({ ...errors, email: '' })
              }}
              placeholder="correo@ejemplo.com"
              error={errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>
        
        {/* Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            ℹ️ Tu factura se generará automáticamente y la recibirás en el email proporcionado.
          </p>
        </div>
        
        {/* Botones */}
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="flex-1"
            disabled={solicitarMutation.isPending}
          >
            {solicitarMutation.isPending ? 'Generando...' : '📄 Generar Factura'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
