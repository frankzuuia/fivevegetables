// =====================================================
// MODAL: Agregar Reglas de Lista de Precios
// Interfaz idéntica a Odoo para crear reglas por producto
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  unit: string
}

interface PriceListRule {
  id?: string
  product_id: string
  product_name: string
  compute_price: 'fixed' | 'percentage'
  fixed_price?: number
  percent_price?: number
}

interface ModalReglasListaPreciosProps {
  isOpen: boolean
  onClose: () => void
  priceListId: string
  priceListName: string
  products: Product[]
  existingRules?: PriceListRule[]
  onSave: (rules: PriceListRule[]) => Promise<void>
}

export function ModalReglasListaPrecios({
  isOpen,
  onClose,
  priceListId,
  priceListName,
  products,
  existingRules = [],
  onSave
}: ModalReglasListaPreciosProps) {
  const [rules, setRules] = useState<PriceListRule[]>(existingRules)
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [newRule, setNewRule] = useState<Partial<PriceListRule>>({
    compute_price: 'fixed',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load existing rules when modal opens
  useEffect(() => {
    if (isOpen && priceListId) {
      setLoading(true)
      fetch(`/api/price-lists/${priceListId}/rules`)
        .then(res => res.json())
        .then(data => {
          if (data.rules) {
            setRules(data.rules)
          }
        })
        .catch(err => console.error('[ModalReglas] Error loading rules:', err))
        .finally(() => setLoading(false))
    }
  }, [isOpen, priceListId])

  const handleAddRule = () => {
    if (!newRule.product_id) {
      toast.error('Selecciona un producto')
      return
    }

    if (newRule.compute_price === 'fixed' && !newRule.fixed_price) {
      toast.error('Ingresa el precio fijo')
      return
    }

    if (newRule.compute_price === 'percentage' && !newRule.percent_price) {
      toast.error('Ingresa el descuento %')
      return
    }

    const product = products.find(p => p.id === newRule.product_id)
    if (!product) return

    const completeRule: PriceListRule = {
      product_id: newRule.product_id!,
      product_name: product.name,
      compute_price: newRule.compute_price!,
      fixed_price: newRule.compute_price === 'fixed' ? newRule.fixed_price : undefined,
      percent_price: newRule.compute_price === 'percentage' ? newRule.percent_price : undefined,
    }

    setRules([...rules, completeRule])
    setNewRule({ compute_price: 'fixed' })
    setIsCreatingRule(false)
    toast.success(`Regla agregada: ${product.name}`)
  }

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
    toast.success('Regla eliminada')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(rules)
      toast.success('Reglas guardadas correctamente')
      onClose()
    } catch (error) {
      toast.error('Error al guardar reglas')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex h-[85vh] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-morph-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-morph-gray-900">
              Reglas de Lista de Precios
            </h2>
            <p className="text-sm text-morph-gray-600 mt-1">
              {priceListName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-morph-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add Rule Button */}
        <div className="mt-4">
          <Button
            onClick={() => setIsCreatingRule(!isCreatingRule)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Agregar una línea
          </Button>
        </div>

        {/* Create Rule Form */}
        {isCreatingRule && (
          <div className="mt-4 rounded-lg border-2 border-morph-primary-300 bg-morph-gray-50 p-6">
            <h3 className="mb-4 text-lg font-semibold text-morph-gray-900">Crear Regla de Precio</h3>

            <div className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Producto <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRule.product_id || ''}
                  onChange={(e) => setNewRule({ ...newRule, product_id: e.target.value })}
                  className="w-full rounded-lg border border-morph-gray-300 px-4 py-2.5 focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
                >
                  <option value="">Todos los productos</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.price ? `- $${product.price.toFixed(2)}` : ''} {product.unit ? `/ ${product.unit}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Type Radio */}
              <div>
                <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                  Tipo de precio <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="percentage"
                      checked={newRule.compute_price === 'percentage'}
                      onChange={() => setNewRule({ ...newRule, compute_price: 'percentage' })}
                      className="h-4 w-4 text-morph-primary-600"
                    />
                    <span className="text-sm">Descuento</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      checked={newRule.compute_price === 'fixed'}
                      onChange={() => setNewRule({ ...newRule, compute_price: 'fixed' })}
                      className="h-4 w-4 text-morph-primary-600"
                    />
                    <span className="text-sm">Precio fijo</span>
                  </label>
                </div>
              </div>

              {/* Conditional Input based on type */}
              {newRule.compute_price === 'percentage' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                    Descuento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={newRule.percent_price || ''}
                      onChange={(e) => setNewRule({ ...newRule, percent_price: parseFloat(e.target.value) })}
                      className="flex-1 rounded-lg border border-morph-gray-300 px-4 py-2.5 focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
                      placeholder="0.00"
                    />
                    <span className="text-sm text-morph-gray-600 w-8">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-morph-gray-700">
                    Precio fijo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newRule.fixed_price || ''}
                      onChange={(e) => setNewRule({ ...newRule, fixed_price: parseFloat(e.target.value) })}
                      className="flex-1 rounded-lg border border-morph-gray-300 px-4 py-2.5 focus:border-morph-primary-500 focus:ring-2 focus:ring-morph-primary-200"
                      placeholder="0.00"
                    />
                    <span className="text-sm text-morph-gray-600 w-16">por kg</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    handleAddRule()
                    setIsCreatingRule(false) // Close form after save
                  }}
                  variant="primary"
                >
                  Guardar y cerrar
                </Button>
                <Button
                  onClick={handleAddRule}
                  variant="outline"
                >
                  Guardar y crear nuevo
                </Button>
                <Button onClick={() => setIsCreatingRule(false)} variant="outline">
                  Descartar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rules Table */}
        <div className="mt-6 flex-1 overflow-y-auto">
          <div className="rounded-lg border border-morph-gray-200">
            <table className="w-full">
              <thead className="bg-morph-gray-50 border-b border-morph-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-morph-gray-600 uppercase">
                    Aplicar en
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-morph-gray-600 uppercase">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-morph-gray-600 uppercase w-24">

                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-morph-gray-200 bg-white">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-morph-gray-500">
                      No hay reglas específicas. Click &quot;Agregar una línea&quot; para crear una.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule, index) => (
                    <tr key={index} className="hover:bg-morph-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-morph-gray-900 font-medium">
                        {rule.product_name || 'Todos los productos'}
                      </td>
                      <td className="px-6 py-4 text-sm text-morph-gray-900">
                        {rule.compute_price === 'fixed'
                          ? `$ ${rule.fixed_price?.toFixed(2)}`
                          : `${rule.percent_price}%`
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveRule(index)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar regla"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-morph-gray-200 pt-4">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Lista'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
