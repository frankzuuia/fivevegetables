// =====================================================
// ODOO XML-RPC CLIENT
// Manejo robusto de conexión con Odoo v17
// =====================================================

import xmlrpc from 'xmlrpc'

const ODOO_URL = process.env.ODOO_URL!
const ODOO_DB = process.env.ODOO_DB!
const ODOO_EMAIL = process.env.ODOO_EMAIL!
const ODOO_API_KEY = process.env.ODOO_API_KEY!

// Parsear URL para obtener host y puerto
function parseOdooURL() {
  const url = new URL(ODOO_URL)
  return {
    host: url.hostname,
    port: parseInt(url.port || (url.protocol === 'https:' ? '443' : '80')),
    path: '/xmlrpc/2',
    secure: url.protocol === 'https:',
  }
}

// Cliente común para Odoo
const commonClient = xmlrpc.createSecureClient(parseOdooURL())

// Cliente de objeto para Odoo
const objectClient = xmlrpc.createSecureClient({
  ...parseOdooURL(),
  path: '/xmlrpc/2/object',
})

// UID de usuario autenticado (se obtiene al autenticar)
let cachedUid: number | null = null

/**
 * Autenticar con Odoo y obtener UID
 */
export async function authenticateOdoo(): Promise<number> {
  if (cachedUid) return cachedUid

  return new Promise((resolve, reject) => {
    commonClient.methodCall(
      'authenticate',
      [ODOO_DB, ODOO_EMAIL, ODOO_API_KEY, {}],
      (error: any, uid: any) => {
        if (error) {
          console.error('[Odoo Auth Error]', error)
          reject(new Error(`Odoo authentication failed: ${error.message || 'Unknown error'}`))
        } else if (!uid) {
          reject(new Error('Odoo authentication returned no UID'))
        } else {
          cachedUid = uid as number
          console.log(`[Odoo] Authenticated successfully. UID: ${uid}`)
          resolve(uid as number)
        }
      }
    )
  })
}

/**
 * Ejecutar método en modelo de Odoo
 */
export async function executeKw<T = any>(
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {}
): Promise<T> {
  const uid = await authenticateOdoo()

  return new Promise((resolve, reject) => {
    const params = [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs]

    objectClient.methodCall('execute_kw', params, (error: any, result: any) => {
      if (error) {
        console.error(`[Odoo Error] Model: ${model}, Method: ${method}`, error)
        reject(
          new Error(`Odoo execute_kw failed: ${error.message || 'Unknown error'}`)
        )
      } else {
        resolve(result as T)
      }
    })
  })
}

// =====================================================
// FUNCIONES ESPECÍFICAS DE ODOO
// =====================================================

/**
 * Obtener productos con stock disponible
 */
export async function getProductsWithStock() {
  try {
    const products = await executeKw<any[]>(
      'product.product',
      'search_read',
      [
        [['active', '=', true]], // Filtro: solo productos activos
      ],
      {
        fields: [
          'id',
          'name',
          'description',
          'list_price',
          'qty_available',
          'categ_id',
        ],
        limit: 1000,
      }
    )
    
    return products
  } catch (error) {
    console.error('[Odoo] Error getting products', error)
    throw error
  }
}

/**
 * Obtener tarifas de precio (price lists)
 */
export async function getPriceLists() {
  try {
    const priceLists = await executeKw<any[]>(
      'product.pricelist',
      'search_read',
      [[]],
      {
        fields: ['id', 'name', 'active'],
        limit: 100,
      }
    )
    
    return priceLists
  } catch (error) {
    console.error('[Odoo] Error getting price lists', error)
    throw error
  }
}

/**
 * Obtener clientes (res.partner)
 */
export async function getPartners() {
  try {
    const partners = await executeKw<any[]>(
      'res.partner',
      'search_read',
      [
        [['customer_rank', '>', 0]], // Solo clientes
      ],
      {
        fields: [
          'id',
          'name',
          'email',
          'phone',
          'property_product_pricelist',
          'street',
          'city',
          'state_id',
          'zip',
        ],
        limit: 1000,
      }
    )
    
    return partners
  } catch (error) {
    console.error('[Odoo] Error getting partners', error)
    throw error
  }
}

/**
 * Crear pedido en Odoo (sale.order)
 */
export async function createSaleOrder(orderData: {
  partner_id: number
  order_line: Array<{
    product_id: number
    product_uom_qty: number
    price_unit: number
  }>
  note?: string
}) {
  try {
    const orderId = await executeKw<number>(
      'sale.order',
      'create',
      [
        {
          partner_id: orderData.partner_id,
          order_line: orderData.order_line.map((line) => [
            0,
            0,
            {
              product_id: line.product_id,
              product_uom_qty: line.product_uom_qty,
              price_unit: line.price_unit,
            },
          ]),
          note: orderData.note || '',
        },
      ]
    )
    
    console.log(`[Odoo] Sale order created with ID: ${orderId}`)
    return orderId
  } catch (error) {
    console.error('[Odoo] Error creating sale order', error)
    throw error
  }
}

/**
 * Actualizar tarifa de un cliente (Control Remoto de Precios)
 */
export async function updatePartnerPricelist(
  partnerId: number,
  pricelistId: number
) {
  try {
    const result = await executeKw<boolean>(
      'res.partner',
      'write',
      [
        [partnerId], // IDs a actualizar
        {
          property_product_pricelist: pricelistId,
        },
      ]
    )
    
    console.log(
      `[Odoo] Partner ${partnerId} pricelist updated to ${pricelistId}`
    )
    return result
  } catch (error) {
    console.error('[Odoo] Error updating partner pricelist', error)
    throw error
  }
}

/**
 * Obtener estado de factura de un pedido
 */
export async function getOrderInvoiceStatus(orderId: number) {
  try {
    const order = await executeKw<any[]>(
      'sale.order',
      'read',
      [[orderId]],
      {
        fields: ['invoice_status', 'invoice_ids'],
      }
    )
    
    if (!order || order.length === 0) {
      throw new Error(`Order ${orderId} not found in Odoo`)
    }
    
    return {
      invoiceStatus: order[0].invoice_status,
      invoiceIds: order[0].invoice_ids || [],
    }
  } catch (error) {
    console.error('[Odoo] Error getting invoice status', error)
    throw error
  }
}

/**
 * Health check de conexión a Odoo
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await authenticateOdoo()
    return true
  } catch (error) {
    console.error('[Odoo] Health check failed', error)
    return false
  }
}
