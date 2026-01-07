'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { updateCliente } from '@/app/actions/clientes'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// Schema coincide con la server action
const EditSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(10, 'El teléfono debe tener 10 dígitos'),
  calle: z.string().min(1, 'Calle requerida'),
  numeroExterior: z.string().min(1, 'Num. Ext. requerido'),
  colonia: z.string().min(1, 'Colonia requerida'),
  codigoPostal: z.string().regex(/^\d{5}$/, 'CP de 5 dígitos'),
  ciudad: z.string().default('Guadalajara'),
})

type FormData = z.infer<typeof EditSchema>

interface Props {
  cliente: any
  onClose: () => void
  onSuccess: () => void
}

export function ModalEditarCliente({ cliente, onClose, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      calle: '',
      numeroExterior: '',
      colonia: '',
      codigoPostal: '',
      ciudad: 'Guadalajara',
    },
  })

  // Cargar datos al montar
  useEffect(() => {
    if (cliente) {
      setValue('nombre', cliente.name || '')
      setValue('telefono', cliente.phone || '')
      setValue('calle', cliente.street || cliente.calle || '')
      setValue('numeroExterior', cliente.numero_exterior || '')
      setValue('colonia', cliente.colonia || '')
      setValue('codigoPostal', cliente.codigo_postal || '')
      setValue('ciudad', cliente.ciudad || 'Guadalajara')
    }
  }, [cliente, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      const result = await updateCliente({
        id: cliente.id,
        ...data,
      })

      if (result.success) {
        toast.success('Cliente actualizado correctamente')
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error inesperado')
      console.error(error)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Editar Cliente"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre y Teléfono */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-morph-gray-700">
              Nombre / Negocio
            </label>
            <input
              {...register('nombre')}
              className="w-full rounded-lg border border-morph-gray-300 px-3 py-2 text-sm focus:border-morph-primary-500 focus:outline-none"
              placeholder="Ej. Tacos El Frank"
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-morph-gray-700">
              Teléfono
            </label>
            <input
              {...register('telefono')}
              className="w-full rounded-lg border border-morph-gray-300 px-3 py-2 text-sm focus:border-morph-primary-500 focus:outline-none"
              placeholder="Ej. 3312345678"
            />
            {errors.telefono && (
              <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div className="rounded-lg bg-morph-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-morph-gray-700">
            Dirección
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-morph-gray-600">
                Calle
              </label>
              <input
                {...register('calle')}
                className="w-full rounded-lg border border-morph-gray-200 px-3 py-2 text-sm focus:border-morph-primary-500 focus:outline-none"
              />
              {errors.calle && (
                <p className="mt-1 text-xs text-red-500">{errors.calle.message}</p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-morph-gray-600">
                Número Exterior
              </label>
              <input
                {...register('numeroExterior')}
                className="w-full rounded-lg border border-morph-gray-200 px-3 py-2 text-sm focus:border-morph-primary-500 focus:outline-none"
              />
              {errors.numeroExterior && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.numeroExterior.message}
                </p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-morph-gray-600">
                Colonia
              </label>
              <input
                {...register('colonia')}
                className="w-full rounded-lg border border-morph-gray-200 px-3 py-2 text-sm focus:border-morph-primary-500 focus:outline-none"
              />
              {errors.colonia && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.colonia.message}
                </p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-morph-gray-600">
                Código Postal
              </label>
              <input
                {...register('codigoPostal')}
                className="w-full rounded-lg border border-morph-gray-200 px-3 py-2 text-sm focus:border-morph-primary-500 focus:outline-none"
              />
              {errors.codigoPostal && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.codigoPostal.message}
                </p>
              )}
            </div>
             <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-morph-gray-600">
                Ciudad
              </label>
              <input
                {...register('ciudad')}
                className="w-full rounded-lg border border-morph-gray-200 px-3 py-2 text-sm focus:border-morph-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
