// =====================================================
// HOOK: usePriceListPrices
// Calcula precios de productos según lista asignada
// Funciona exactamente como Odoo
// =====================================================

import { useQuery } from '@tanstack/react-query'

interface Product {
  id: string
  name: string
  price: number
  [key: string]: any
}

interface PriceListRule {
  product_id: string | null
  compute_price: 'fixed' | 'percentage'
  fixed_price?: number
  percent_price?: number
}

interface ProductWithPrice extends Product {
  original_price: number
  final_price: number
  has_special_price: boolean
  discount_percent?: number
}

/**
 * Hook para calcular precios según lista asignada
 * Si el cliente tiene price_list_id, aplica reglas
 * Si no, usa precio público normal
 */
export function usePriceListPrices(clientId: string | null, products: Product[]) {
  const { data: priceListData } = useQuery({
    queryKey: ['client-pricelist', clientId],
    queryFn: async () => {
      if (!clientId) return null

      // Obtener cliente y su price_list_id
      const clientResponse = await fetch(`/api/clientes/${clientId}`)
      if (!clientResponse.ok) return null
      
      const clientData = await clientResponse.json()
      const priceListId = clientData.client?.price_list_id

      if (!priceListId) return null

      // Obtener reglas de la lista
      const rulesResponse = await fetch(`/api/price-lists/${priceListId}/rules`)
      if (!rulesResponse.ok) return null

      const rulesData = await rulesResponse.json()
      return {
        priceListId,
        rules: rulesData.rules || []
      }
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  /**
   * Calcula precio final para un producto según reglas de Odoo:
   * 1. Busca regla específica para ese producto
   * 2. Si no hay, busca regla global (product_id = null)
   * 3. Si no hay regla, usa precio público
   */
  const calculatePrice = (product: Product): ProductWithPrice => {
    const originalPrice = product.price

    // Sin lista de precios? Precio normal
    if (!priceListData || !priceListData.rules) {
      return {
        ...product,
        original_price: originalPrice,
        final_price: originalPrice,
        has_special_price: false
      }
    }

    // Buscar regla específica para este producto
    let rule = priceListData.rules.find((r: PriceListRule) => r.product_id === product.id)

    // Si no hay regla específica, buscar regla global
    if (!rule) {
      rule = priceListData.rules.find((r: PriceListRule) => !r.product_id || r.product_id === '')
    }

    // Sin regla aplicable? Precio normal
    if (!rule) {
      return {
        ...product,
        original_price: originalPrice,
        final_price: originalPrice,
        has_special_price: false
      }
    }

    // Aplicar regla según tipo
    let finalPrice = originalPrice

    if (rule.compute_price === 'fixed' && rule.fixed_price) {
      // Precio fijo absoluto
      finalPrice = rule.fixed_price
    } else if (rule.compute_price === 'percentage' && rule.percent_price) {
      // Descuento porcentual
      const discount = originalPrice * (rule.percent_price / 100)
      finalPrice = originalPrice - discount
    }

    return {
      ...product,
      original_price: originalPrice,
      final_price: Math.max(0, finalPrice), // No negativo
      has_special_price: finalPrice !== originalPrice,
      discount_percent: rule.compute_price === 'percentage' ? rule.percent_price : undefined
    }
  }

  // Mapear todos los productos con sus precios calculados
  const productsWithPrices = products.map(calculatePrice)

  return {
    products: productsWithPrices,
    isLoading: false,
    hasPriceList: !!priceListData,
    priceListId: priceListData?.priceListId
  }
}
