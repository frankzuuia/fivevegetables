// Funciones adicionales agregadas al final de odoo/client.ts

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
          discount_percent: values.discount_percent,
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
