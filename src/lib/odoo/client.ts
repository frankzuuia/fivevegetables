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
    path: '/xmlrpc/2/common',
    secure: url.protocol === 'https:',
  }
}

// Cliente común para Odoo
const commonClient = xmlrpc.createSecureClient(parseOdooURL())

// Cliente de objeto para Odoo
const objectClient = xmlrpc.createSecureClient({
  host: parseOdooURL().host,
  port: parseOdooURL().port,
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
          'image_1920',
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

/**
 * Crear partner (cliente) en Odoo
 * Usado en auto-registro de clientes
 */
export async function createPartnerInOdoo(data: {
  name: string
  email: string
  phone: string
  street: string
  city: string
  zip: string
}): Promise<number> {
  try {
    const partnerId = await executeKw<number>(
      'res.partner',
      'create',
      [{
        name: data.name,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        zip: data.zip,
        country_id: 156, // México (ID estándar en Odoo)
        state_id: 491, // Jalisco, México (ID estándar en Odoo)
        is_company: true,
        customer_rank: 1,
      }],
      {}
    )

    console.log(`[Odoo] Partner created: ${partnerId} - ${data.name}`)
    return partnerId
  } catch (error) {
    console.error('[Odoo] Error creating partner', error)
    throw error
  }
}

/**
 * Crear factura desde sale.order (CFDI México)
 */
export async function createInvoice(
  saleOrderId: number,
  invoiceData: {
    l10n_mx_edi_usage?: string
  }
): Promise<number> {
  try {
    // 1. Crear factura desde sale.order
    const invoiceIds = await executeKw<number[]>(
      'sale.order',
      '_create_invoices',
      [[saleOrderId]],
      {}
    )

    if (!invoiceIds || invoiceIds.length === 0) {
      throw new Error('No se pudo crear factura desde sale.order')
    }

    const invoiceId = invoiceIds[0]
    console.log(`[Odoo] Invoice created: ${invoiceId} from SO ${saleOrderId}`)

    // 2. Actualizar campos específicos CFDI si se proporcionan
    if (invoiceData.l10n_mx_edi_usage) {
      await executeKw(
        'account.move',
        'write',
        [[invoiceId], {
          l10n_mx_edi_usage: invoiceData.l10n_mx_edi_usage
        }],
        {}
      )
    }

    // 3. Confirmar factura (draft → posted)
    await executeKw(
      'account.move',
      'action_post',
      [[invoiceId]],
      {}
    )

    console.log(`[Odoo] Invoice ${invoiceId} posted successfully`)

    return invoiceId

  } catch (error) {
    console.error('[Odoo] Error creating invoice', error)
    throw error
  }
}

/**
 * Obtener URL del PDF de factura
 */
export async function getInvoicePDF(invoiceId: number): Promise<string> {
  try {
    const invoice = await executeKw<any[]>(
      'account.move',
      'read',
      [[invoiceId]],
      {
        fields: ['l10n_mx_edi_cfdi_uuid', 'name']
      }
    )

    if (!invoice || invoice.length === 0) {
      throw new Error(`Invoice ${invoiceId} not found in Odoo`)
    }

    // Construir URL del PDF
    // Odoo expone reportes en /report/pdf/...
    const odooUrl = process.env.ODOO_URL || ''
    const pdfUrl = `${odooUrl}/web/content/account.move/${invoiceId}/invoice_pdf_report_file?download=true`

    console.log(`[Odoo] Invoice PDF URL generated for ${invoiceId}`)

    return pdfUrl

  } catch (error) {
    console.error('[Odoo] Error getting invoice PDF', error)
    throw error
  }
}


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

/**
 * Eliminar partner en Odoo (archivar)
 */
export async function deletePartnerInOdoo(partnerId: number): Promise<void> {
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
        [[partnerId], { active: false }],
      ],
      (error: any, result: any) => {
        if (error) {
          console.error('[Odoo Delete Partner Error]', error)
          reject(error)
          return
        }
        console.log(`[Odoo] Partner ${partnerId} archived successfully`)
        resolve()
      }
    )
  })
}
