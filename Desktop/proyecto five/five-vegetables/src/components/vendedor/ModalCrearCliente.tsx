// =====================================================
// COMPONENT: Modal Crear Cliente (Vendedor)
// Form completo dirección entrega + tarifa
// =====================================================

'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCrearCliente } from '@/lib/hooks/useClientes'
import { usePriceLists } from '@/lib/hooks/usePricelist'
import { toast } from 'sonner'

interface ModalCrearClienteProps {
  storeId: string
  onClose: () => void
  onSuccess?: () => void
}

export function ModalCrearCliente({
  storeId,
  onClose,
  onSuccess,
}: ModalCrearClienteProps) {
  const [formData, setFormData] = useState({
    // Datos básicos
    nombre: '',
    telefono: '',
    email: '',
    nombreRestaurant: '',
    
    // Dirección entrega
    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    entreCalles: '',
    codigoPostal: '',
    referencias: '',
    
    // Comercial
    pricelistId: '',
    requiereFactura: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { data: pricelists, isLoading: loadingPricelists } = usePriceLists(storeId)
  const crearMutation = useCrearCliente()
  
  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nombre) newErrors.nombre = 'Nombre requerido'
    if (!formData.telefono || formData.telefono.length < 10) {
      newErrors.telefono = 'Teléfono debe tener 10 dígitos'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.nombreRestaurant) newErrors.nombreRestaurant = 'Nombre del restaurant requerido'
    if (!formData.calle) newErrors.calle = 'Calle requerida'
    if (!formData.numeroExterior) newErrors.numeroExterior = 'Número exterior requerido'
    if (!formData.colonia) newErrors.colonia = 'Colonia requerida'
    if (!formData.entreCalles) newErrors.entreCalles = 'Entre calles requerido'
    if (!formData.codigoPostal || !/^\d{5}$/.test(formData.codigoPostal)) {
      newErrors.codigoPostal = 'CP debe tener 5 dígitos'
    }
    if (!formData.pricelistId) newErrors.pricelistId = 'Seleccione una tarifa'
    
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
      const result = await crearMutation.mutateAsync(formData)
      
      if (result.needsPin) {
        toast.success(result.message, { duration: 5000 })
        toast.info('⚠️ Cliente sin email. Revisa el PIN en la sección Gerente.', {
          duration: 8000,
        })
      } else {
        toast.success(result.message)
      }
      
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear cliente')
    }
  }
  
  return (
    <Modal isOpen onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-morph-gray-900">
            Crear Nuevo Cliente
          </h2>
          <p className="mt-2 text-sm text-morph-gray-600">
            El cliente quedará asignado automáticamente a ti
          </p>
        </div>
        
        {/* Form */}
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
          {/* Datos básicos */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-morph-gray-800">
              👤 Datos de Contacto
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre Contacto *"
                value={formData.nombre}
                onChange={(e) => {
                  setFormData({ ...formData, nombre: e.target.value })
                  setErrors({ ...errors, nombre: '' })
                }}
                error={errors.nombre}
              />
              <Input
                label="Teléfono *"
                value={formData.telefono}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, telefono: cleaned })
                  setErrors({ ...errors, telefono: '' })
                }}
                placeholder="3312345678"
                maxLength={10}
                error={errors.telefono}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Email (opcional)"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setErrors({ ...errors, email: '' })
                }}
                placeholder="correo@ejemplo.com"
                error={errors.email}
              />
              <p className="mt-1 text-xs text-morph-gray-500">
                ℹ️ Si no tiene email, el gerente le enviará el PIN por WhatsApp
              </p>
            </div>
          </div>
          
          {/* Negocio */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-morph-gray-800">
              🏪 Datos del Negocio
            </h3>
            <Input
              label="Nombre del Restaurant *"
              value={formData.nombreRestaurant}
              onChange={(e) => {
                setFormData({ ...formData, nombreRestaurant: e.target.value })
                setErrors({ ...errors, nombreRestaurant: '' })
              }}
              placeholder="La Taquería"
              error={errors.nombreRestaurant}
            />
          </div>
          
          {/* Dirección entrega */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-morph-gray-800">
              📍 Dirección de Entrega
            </h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input
                    label="Calle *"
                    value={formData.calle}
                    onChange={(e) => {
                      setFormData({ ...formData, calle: e.target.value })
                      setErrors({ ...errors, calle: '' })
                    }}
                    error={errors.calle}
                  />
                </div>
                <Input
                  label="# Exterior *"
                  value={formData.numeroExterior}
                  onChange={(e) => {
                    setFormData({ ...formData, numeroExterior: e.target.value })
                    setErrors({ ...errors, numeroExterior: '' })
                  }}
                  error={errors.numeroExterior}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="# Interior (opcional)"
                  value={formData.numeroInterior}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroInterior: e.target.value })
                  }
                />
                <Input
                  label="Colonia *"
                  value={formData.colonia}
                  onChange={(e) => {
                    setFormData({ ...formData, colonia: e.target.value })
                    setErrors({ ...errors, colonia: '' })
                  }}
                  error={errors.colonia}
                />
              </div>
              
              <Input
                label="Entre qué calles *"
                value={formData.entreCalles}
                onChange={(e) => {
                  setFormData({ ...formData, entreCalles: e.target.value })
                  setErrors({ ...errors, entreCalles: '' })
                }}
                placeholder="Av. Revolución y Calle Hidalgo"
                error={errors.entreCalles}
              />
              
              <Input
                label="Código Postal *"
                value={formData.codigoPostal}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, codigoPostal: cleaned })
                  setErrors({ ...errors, codigoPostal: '' })
                }}
                placeholder="44100"
                maxLength={5}
                error={errors.codigoPostal}
              />
              
              <Input
                label="Referencias (opcional)"
                value={formData.referencias}
                onChange={(e) =>
                  setFormData({ ...formData, referencias: e.target.value })
                }
                placeholder="Portón verde, casa esquina"
              />
            </div>
          </div>
          
          {/* Comercial */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-morph-gray-800">
              💰 Configuración Comercial
            </h3>
            <div>
              <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                Tarifa de Precio *
              </label>
              <select
                value={formData.pricelistId}
                onChange={(e) => {
                  setFormData({ ...formData, pricelistId: e.target.value })
                  setErrors({ ...errors, pricelistId: '' })
                }}
                className={`w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-morph-primary-500 ${
                  errors.pricelistId ? 'border-red-500' : 'border-morph-gray-300'
                }`}
                disabled={loadingPricelists}
              >
                <option value="">Seleccionar...</option>
                {pricelists?.map((pricelist) => (
                  <option key={pricelist.id} value={pricelist.id}>
                    {pricelist.name} ({pricelist.type}) -{' '}
                    {pricelist.discount_percentage}% desc
                  </option>
                ))}
              </select>
              {errors.pricelistId && (
                <p className="mt-1 text-sm text-red-600">{errors.pricelistId}</p>
              )}
            </div>
            
            <div className="mt-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiereFactura}
                  onChange={(e) =>
                    setFormData({ ...formData, requiereFactura: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-morph-primary-600 focus:ring-morph-primary-500"
                />
                <span className="text-sm text-morph-gray-700">
                  Este cliente requiere factura por default
                </span>
              </label>
            </div>
          </div>
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
            disabled={crearMutation.isPending}
          >
            {crearMutation.isPending ? 'Creando...' : '✅ Crear Cliente'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
