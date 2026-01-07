// =====================================================
// Odoo Price Lists Sync
// Sincronización bidireccional de listas de precios
// =====================================================

import xmlrpc from 'xmlrpc'

interface OdooPricelist {
  id: number
  name: string
  currency_id: [number, string]
  active: boolean
  discount_policy?: string
}

interface OdooPricelistItem {
  id: number
  pricelist_id: [number, string]
  product_tmpl_id?: [number, string]
  categ_id?: [number, string]
  min_quantity: number
  date_start?: string
  date_end?: string
  compute_price: 'fixed' | 'percentage' | 'formula'
  fixed_price?: number
  percent_price?: number
}

/**
 * Obtener todas las listas de precios desde Odoo
 */
export async function fetchOdooPricelists(
  url: string,
  db: string,
  username: string,
  password: string
): Promise<OdooPricelist[]> {
  const common = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/common' })
  const models = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/object' })

  // Autenticar
  const uid = await new Promise<number>((resolve, reject) => {
    common.methodCall('authenticate', [db, username, password, {}], (error, value) => {
      if (error) reject(error)
      else resolve(value as number)
    })
  })

  // Buscar listas de precios
  const pricelistIds = await new Promise<number[]>((resolve, reject) => {
    models.methodCall(
      'execute_kw',
      [db, uid, password, 'product.pricelist', 'search', [[['active', '=', true]]]],
      (error, value) => {
        if (error) reject(error)
        else resolve(value as number[])
      }
    )
  })

  // Leer datos completos
  const pricelists = await new Promise<OdooPricelist[]>((resolve, reject) => {
    models.methodCall(
      'execute_kw',
      [
        db,
        uid,
        password,
        'product.pricelist',
        'read',
        [pricelistIds, ['id', 'name', 'currency_id', 'active', 'discount_policy']]
      ],
      (error, value) => {
        if (error) reject(error)
        else resolve(value as OdooPricelist[])
      }
    )
  })

  return pricelists
}

/**
 * Obtener items/reglas de una lista de precios
 */
export async function fetchPricelistItems(
  url: string,
  db: string,
  username: string,
  password: string,
  pricelistId: number
): Promise<OdooPricelistItem[]> {
  const common = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/common' })
  const models = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/object' })

  const uid = await new Promise<number>((resolve, reject) => {
    common.methodCall('authenticate', [db, username, password, {}], (error, value) => {
      if (error) reject(error)
      else resolve(value as number)
    })
  })

  // Buscar items de esta pricelist
  const itemIds = await new Promise<number[]>((resolve, reject) => {
    models.methodCall(
      'execute_kw',
      [db, uid, password, 'product.pricelist.item', 'search', [[['pricelist_id', '=', pricelistId]]]],
      (error, value) => {
        if (error) reject(error)
        else resolve(value as number[])
      }
    )
  })

  if (itemIds.length === 0) return []

  // Leer datos completos
  const items = await new Promise<OdooPricelistItem[]>((resolve, reject) => {
    models.methodCall(
      'execute_kw',
      [
        db,
        uid,
        password,
        'product.pricelist.item',
        'read',
        [
          itemIds,
          [
            'id',
            'pricelist_id',
            'product_tmpl_id',
            'categ_id',
            'min_quantity',
            'date_start',
            'date_end',
            'compute_price',
            'fixed_price',
            'percent_price'
          ]
        ]
      ],
      (error, value) => {
        if (error) reject(error)
        else resolve(value as OdooPricelistItem[])
      }
    )
  })

  return items
}

/**
 * Crear una lista de precios en Odoo
 */
export async function createOdooPricelist(
  url: string,
  db: string,
  username: string,
  password: string,
  name: string,
  discountPercent: number = 0
): Promise<number> {
  const common = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/common' })
  const models = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/object' })

  const uid = await new Promise<number>((resolve, reject) => {
    common.methodCall('authenticate', [db, username, password, {}], (error, value) => {
      if (error) reject(error)
      else resolve(value as number)
    })
  })

  // Crear pricelist
  const pricelistId = await new Promise<number>((resolve, reject) => {
    models.methodCall(
      'execute_kw',
      [
        db,
        uid,
        password,
        'product.pricelist',
        'create',
        [
          {
            name: name,
            active: true,
            discount_policy: 'with_discount'
          }
        ]
      ],
      (error, value) => {
        if (error) reject(error)
        else resolve(value as number)
      }
    )
  })

  // Si hay descuento, crear regla general
  if (discountPercent > 0) {
    await new Promise<number>((resolve, reject) => {
      models.methodCall(
        'execute_kw',
        [
          db,
          uid,
          password,
          'product.pricelist.item',
          'create',
          [
            {
              pricelist_id: pricelistId,
              compute_price: 'percentage',
              percent_price: discountPercent,
              applied_on: '3_global' // Todos los productos
            }
          ]
        ],
        (error, value) => {
          if (error) reject(error)
          else resolve(value as number)
        }
      )
    })
  }

  return pricelistId
}

/**
 * Actualizar lista de precios en Odoo
 */
export async function updateOdooPricelist(
  url: string,
  db: string,
  username: string,
  password: string,
  odooId: number,
  name: string,
  active: boolean
): Promise<boolean> {
  const common = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/common' })
  const models = xmlrpc.createSecureClient({ host: new URL(url).hostname, path: '/xmlrpc/2/object' })

  const uid = await new Promise<number>((resolve, reject) => {
    common.methodCall('authenticate', [db, username, password, {}], (error, value) => {
      if (error) reject(error)
      else resolve(value as number)
    })
  })

  await new Promise<boolean>((resolve, reject) => {
    models.methodCall(
      'execute_kw',
      [db, uid, password, 'product.pricelist', 'write', [[odooId], { name, active }]],
      (error, value) => {
        if (error) reject(error)
        else resolve(value as boolean)
      }
    )
  })

  return true
}
