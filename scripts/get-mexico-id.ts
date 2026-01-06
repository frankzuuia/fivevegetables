/**
 * Script para encontrar el ID de México en Odoo
 * Ejecutar desde Node.js: node scripts/get-mexico-id.js
 */

import { executeKw } from '../src/lib/odoo/client'

async function getMexicoCountryId() {
  try {
    // Buscar país México
    const countries = await executeKw<any[]>(
      'res.country',
      'search_read',
      [
        [['name', '=', 'Mexico'], ['|'], ['code', '=', 'MX']]
      ],
      {
        fields: ['id', 'name', 'code'],
        limit: 5
      }
    )
    
    console.log('Países encontrados:', countries)
    
    if (countries && countries.length > 0) {
      console.log(`\n✅ ID de México: ${countries[0].id}`)
      console.log(`Nombre: ${countries[0].name}`)
      console.log(`Código: ${countries[0].code}`)
    } else {
      console.log('❌ No se encontró México')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

getMexicoCountryId()
