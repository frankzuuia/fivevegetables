// =====================================================
// INSTRUCCIONES: COPIAR ESTAS FUNCIONES AL FINAL DE
// src/lib/odoo/client.ts (después de getInvoicePDFUrl)
// =====================================================

// =====================================================
// PRODUCT MANAGEMENT
// =====================================================

/**
 * Actualizar producto en Odoo
 */
export async function updateProductInOdoo(productId: number, values: Record<string, any>): Promise<void> {
  const uid = await authenticateOdoo()
  
  return new Promise((resolve, reject) => {
    objectClient.methodCall(
      'execute_kw',
      [
        ODOO_DB,
        uid,
        ODOO_API_KEY,
        'product.template',
        'write',
        [[productId], values],
      ],
      (error: any, result: any) => {
        if (error) {
          console.error('[Odoo Update Product Error]', error)
          reject(error)
          return
        }
        console.log(`[Odoo] Product ${productId} updated successfully`)
        resolve()
      }
    )
  })
}

// =====================================================
// PRICELIST MANAGEMENT
// =====================================================

/**
 * Crear lista de precios en Odoo
 */
export async function createPriceListInOdoo(values: {
  name: string
  discount_percent: number
}): Promise<number> {
  const uid = await authenticateOdoo()
  
  return new Promise((resolve, reject) => {
    objectClient.methodCall(
      'execute_kw',
      [
        ODOO_DB,
        uid,
        ODOO_API_KEY,
        'product.pricelist',
        'create',
        [{
          name: values.name,
          discount_policy: 'without_discount',
          active: true,
        }],
      ],
      (error: any, result: any) => {
        if (error) {
          console.error('[Odoo Create PriceList Error]', error)
          reject(error)
          return
        }
        console.log(`[Odoo] PriceList created with ID: ${result}`)
        resolve(result)
      }
    )
  })
}

/**
 * Actualizar lista de precios en Odoo
 */
export async function updatePriceListInOdoo(pricelistId: number, values: Record<string, any>): Promise<void> {
  const uid = await authenticateOdoo()
  
  return new Promise((resolve, reject) => {
    objectClient.methodCall(
      'execute_kw',
      [
        ODOO_DB,
        uid,
        ODOO_API_KEY,
        'product.pricelist',
        'write',
        [[pricelistId], values],
      ],
      (error: any, result: any) => {
        if (error) {
          console.error('[Odoo Update PriceList Error]', error)
          reject(error)
          return
        }
        console.log(`[Odoo] PriceList ${pricelistId} updated successfully`)
        resolve()
      }
    )
  })
}

/**
 * Eliminar lista de precios en Odoo (archivar)
 */
export async function deletePriceListInOdoo(pricelistId: number): Promise<void> {
  const uid = await authenticateOdoo()
  
  return new Promise((resolve, reject) => {
    objectClient.methodCall(
      'execute_kw',
      [
        ODOO_DB,
        uid,
        ODOO_API_KEY,
        'product.pricelist',
        'write',
        [[pricelistId], { active: false }],
      ],
      (error: any, result: any) => {
        if (error) {
          console.error('[Odoo Delete PriceList Error]', error)
          reject(error)
          return
        }
        console.log(`[Odoo] PriceList ${pricelistId} archived successfully`)
        resolve()
      }
    )
  })
}

// =====================================================
// PARTNER MANAGEMENT
// =====================================================

/**
 * Actualizar partner (cliente) en Odoo
 */
export async function updatePartnerInOdoo(partnerId: number, values: Record<string, any>): Promise<void> {
  const uid = await authenticateOdoo()
  
  return new Promise((resolve, reject) => {
    objectClient.methodCall(
      'execute_kw',
      [
        ODOO_DB,
        uid,
        ODOO_API_KEY,
        'res.partner',
        'write',
        [[partnerId], values],
      ],
      (error: any, result: any) => {
        if (error) {
          console.error('[Odoo Update Partner Error]', error)
          reject(error)
          return
        }
        console.log(`[Odoo] Partner ${partnerId} updated successfully`)
        resolve()
      }
    )
  })
}
