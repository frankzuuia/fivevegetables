# RESUMEN COMPLETO DEL PROYECTO - Five Vegetables

## ÚLTIMA SESIÓN - PROBLEMAS PENDIENTES

### Bug Crítico Actual
**BOTÓN "Actualizar desde Odoo" NO FUNCIONA**
- Ubicación: `src/components/gerente/GestorListasPrecios.tsx` línea 197-213
- Problema: El onClick no se ejecuta, los console.logs no aparecen
- Causa probable: Error en edición de archivo con caracteres especiales
- **SOLUCIÓN PENDIENTE:** Reescribir el onClick del botón con try-catch y logs

### Funcionalidad Implementada (Parcial)
```typescript
// src/app/actions/products.ts - línea 464+
export async function syncPriceListsFromOdoo()
```
- Server action creada ✅
- Función helper en Odoo client creada ✅
- Botón en UI agregado ❌ (no funciona)

---

## PROYECTO: Five Vegetables - Dashboard ERP

### Stack Tecnológico
- **Framework:** Next.js 16.1.1 (App Router, Turbopack)
- **Base de Datos:** Supabase (PostgreSQL)
- **ERP:** Odoo 19 (XML-RPC API)
- **Styling:** Vanilla CSS (Morfología Design System)
- **State:** React Query (@tanstack/react-query)
- **Validación:** Zod
- **Iconos:** Lucide React
- **Notificaciones:** Sonner (toast)

### Estructura del Proyecto
```
five-vegetables/
├── src/
│   ├── app/
│   │   ├── actions/         # Server Actions
│   │   │   ├── products.ts  # CRUD productos y listas precios
│   │   │   └── prices.ts    # Cálculo de precios
│   │   ├── api/             # API Routes
│   │   │   ├── products/
│   │   │   ├── price-lists/
│   │   │   ├── sync/        # Sincronización Odoo
│   │   │   └── uoms/
│   │   └── dashboard/
│   │       ├── gerente/     # Dashboard manager
│   │       ├── vendedor/    # Dashboard vendedor
│   │       └── comprador/   # Dashboard comprador
│   ├── components/
│   │   ├── gerente/         # Componentes manager
│   │   │   ├── GestorListasPrecios.tsx  ⚠️ ARCHIVO CON BUG
│   │   │   ├── ModalReglasListaPrecios.tsx
│   │   │   └── GestionProductos.tsx
│   │   └── ui/              # Componentes reutilizables
│   ├── lib/
│   │   ├── odoo/
│   │   │   ├── client.ts    # Cliente Odoo XML-RPC
│   │   │   └── pricelist-sync.ts
│   │   └── supabase/
│   └── types/
│       └── database.ts      # Tipos generados
└── supabase/
    └── migrations/
```

---

## ESQUEMA DE BASE DE DATOS (Supabase)

### Tabla: `price_lists`
```sql
CREATE TABLE price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  odoo_pricelist_id INTEGER,  -- NULLABLE: ID en Odoo
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('mayorista', 'minorista', 'especial')),
  discount_percentage NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Tabla: `price_list_items` (Reglas)
```sql
CREATE TABLE price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE,
  odoo_id INTEGER,
  product_id UUID REFERENCES products_cache(id),
  category_id UUID,
  min_quantity NUMERIC DEFAULT 0,
  date_start DATE,
  date_end DATE,
  compute_price TEXT CHECK (compute_price IN ('fixed', 'percentage', 'formula')),
  fixed_price NUMERIC,
  percent_price NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);
```

### Tabla: `products_cache`
```sql
CREATE TABLE products_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_product_id INTEGER UNIQUE NOT NULL,  -- ID en product.template
  name TEXT NOT NULL,
  list_price NUMERIC NOT NULL,
  uom TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP DEFAULT now()
);
```

### Tabla: `clients_mirror`
```sql
CREATE TABLE clients_mirror (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_partner_id INTEGER UNIQUE NOT NULL,  -- ID en res.partner
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  pricelist_id UUID REFERENCES price_lists(id),
  odoo_pricelist_id INTEGER,  -- ID de la pricelist en Odoo
  active BOOLEAN DEFAULT true
);
```

---

## INTEGRACIÓN ODOO (XML-RPC)

### Variables de Entorno (.env.local)
```bash
# Odoo Configuration
ODOO_URL=https://fiveprueba.odoo.com
ODOO_DATABASE=fiveprueba
ODOO_USERNAME=frankzuuia@gmail.com
ODOO_PASSWORD=[API_KEY_AQUI]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tansqtlmfhsgkhsiqbyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[KEY_AQUI]
SUPABASE_SERVICE_ROLE_KEY=[KEY_AQUI]
```

### Modelos Odoo Usados

#### 1. `product.template` (Productos)
```python
# Campos importantes:
- id: int
- name: str
- list_price: float
- uom_id: [int, str]  # Tupla [ID, "Nombre"]
- active: bool
- image_1920: bytes  # Imagen base64
```

**Métodos XML-RPC:**
- `search([[]])` - Buscar IDs
- `read([ids], {fields: [...]})` - Leer datos
- `write([ids], {values})` - Actualizar
- `create({values})` - Crear

#### 2. `product.pricelist` (Listas de Precios)
```python
# Campos:
- id: int
- name: str
- currency_id: [int, str]
- active: bool
- discount_policy: str
```

**⚠️ PROBLEMA CONOCIDO:**
- El producto "aguacate" tiene ID 5 en Odoo
- La lista "restaurante 12345" TAMBIÉN tiene ID 5 en Odoo
- Esto causa conflictos en sync de productos

#### 3. `product.pricelist.item` (Reglas)
```python
# Campos:
- id: int
- pricelist_id: int
- product_tmpl_id: [int, str]  # Opcional
- categ_id: [int, str]  # Opcional
- min_quantity: float
- compute_price: 'fixed' | 'percentage' | 'formula'
- fixed_price: float
- percent_price: float
- applied_on: '0_product_variant' | '1_product' | '2_product_category' | '3_global'
```

#### 4. `uom.uom` (Unidades de Medida)
```python
# Campos:
- id: int
- name: str
- category_id: [int, str]
```

#### 5. `res.partner` (Clientes)
```python
# Campos:
- id: int
- name: str
- email: str
- phone: str
- property_product_pricelist: int  # ID de pricelist asignada
```

---

## FUNCIONES PRINCIPALES

### Cliente Odoo (`src/lib/odoo/client.ts`)

```typescript
// Autenticación
export async function authenticateOdoo(): Promise<number>

// Productos
export async function updateProductInOdoo(productId: number, values: Record<string, any>): Promise<void>

// Listas de Precios
export async function createPriceListInOdoo(data: { name: string; discount_percent?: number }): Promise<number>
export async function updatePriceListInOdoo(pricelistId: number, values: Record<string, any>): Promise<void>
export async function readPriceListFromOdoo(pricelistId: number): Promise<{ name: string; active: boolean }>
export async function getAllPriceListsFromOdoo(): Promise<Array<{ id: number; name: string; active: boolean }>>
export async function deletePriceListInOdoo(pricelistId: number): Promise<void>

// Reglas de Precios
export async function updatePriceListItemsInOdoo(pricelistId: number, items: PriceListItem[]): Promise<void>

// Unidades de Medida
export async function getUnitsOfMeasureFromOdoo(): Promise<Array<{ id: number; name: string }>>

// Clientes
export async function updatePartnerInOdoo(partnerId: number, values: Record<string, any>): Promise<void>
```

### Server Actions (`src/app/actions/products.ts`)

```typescript
// Productos
export async function updateProductPrice(input: { productId, odooProductId, newPrice, uomId? })
export async function toggleProductActive(input: { productId, odooProductId, active })

// Listas de Precios
export async function createPriceList(input: { name, type, discountPercentage })
export async function updatePriceList(input: { priceListId, name, type, discountPercentage })
export async function deletePriceList(input: { priceListId })
export async function assignPriceListToClient(input: { clientId, priceListId })

// ⚠️ NUEVA FUNCIÓN - NO FUNCIONA AÚN
export async function syncPriceListsFromOdoo()  // Línea 464+
```

---

## SINCRONIZACIÓN BIDIRECCIONAL

### Dashboard → Odoo ✅ FUNCIONA

**Productos:**
1. Cambiar precio → `updateProductPrice()` → Odoo `product.template.write()`
2. Toggle activo → `toggleProductActive()` → Odoo `product.template.write()`

**Listas de Precios:**
1. Editar nombre → `updatePriceList()` → Odoo `product.pricelist.write()`
2. Lee de vuelta con `readPriceListFromOdoo()` para confirmar
3. Actualiza Supabase con datos de Odoo

### Odoo → Dashboard ❌ NO FUNCIONA

**PROBLEMA ACTUAL:**
- Función `syncPriceListsFromOdoo()` creada pero botón no ejecuta
- Archivo: `src/components/gerente/GestorListasPrecios.tsx` líneas 197-213

**CÓDIGO QUE DEBE FUNCIONAR:**
```typescript
<Button
  onClick={async () => {
    try {
      console.log('[UI] Sync button clicked')
      const { syncPriceListsFromOdoo } = await import('@/app/actions/products')
      const result = await syncPriceListsFromOdoo()
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['price-lists'] })
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('[UI] Error:', error)
      toast.error('Error al sincronizar')
    }
  }}
  variant="outline"
>
  <RefreshCw className="h-5 w-5" />
  Actualizar desde Odoo
</Button>
```

**SÍNTOMAS:**
- No aparecen logs en consola
- Botón visualmente presente pero onClick no ejecuta
- Problema posible: caracteres especiales en edición de archivo

---

## ÚLTIMOS COMMITS

```bash
c910fb6 - Add: Sync from Odoo button in UI
41b83f1 - Add: Sync Price Lists from Odoo function and button
57d4e70 - Fix: Remove broken Sync Pricelists button completely
8c8de2c - Fix: Clean pricelist bidirectional sync
12eec75 - Clean: Use helper function for reading pricelists
```

---

## DOCUMENTACIÓN ODOO ÚTIL

### XML-RPC API
- **Docs Oficiales:** https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
- **search_read:** Combina search + read en una llamada
- **Dominios:** `[[['field', 'operator', 'value']]]`
  - Ejemplos: `[['active', '=', true]]`, `[['id', 'in', [1,2,3]]]`

### Ejemplos de Llamadas

**Buscar y leer pricelists:**
```javascript
// Search
ids = models.execute_kw(db, uid, password, 
  'product.pricelist', 'search', 
  [[['active', '=', true]]]
)

// Read
data = models.execute_kw(db, uid, password,
  'product.pricelist', 'read',
  [ids],
  {fields: ['id', 'name', 'active']}
)
```

**Actualizar:**
```javascript
models.execute_kw(db, uid, password,
  'product.pricelist', 'write',
  [[pricelistId], {name: 'Nuevo nombre'}]
)
```

---

## PRÓXIMOS PASOS PARA EL SIGUIENTE CHAT

### 1. ARREGLAR BOTÓN "Actualizar desde Odoo" ⚠️ URGENTE
**Archivo:** `src/components/gerente/GestorListasPrecios.tsx`
**Líneas:** 197-213

**Acción:** Reescribir el onClick con:
- try-catch
- console.logs para debugging
- Verificar que import funcione
- Probar en modo incógnito si persiste error

### 2. SOLUCIONAR BUG DE IDs DUPLICADOS
**Problema:** Producto "aguacate" y lista "restaurante 12345" ambos tienen ID 5
**Impacto:** Sync de productos sobrescribe nombre del aguacate

**Soluciones posibles:**
- Cambiar ID del producto en Odoo
- Agregar validación en sync para separar por modelo
- Usar campos diferentes (`odoo_product_id` vs `odoo_pricelist_id`)

### 3. TESTING COMPLETO
- Crear lista en dashboard → Verificar en Odoo
- Editar lista en dashboard → Verificar en Odoo
- Editar lista en Odoo → Sincronizar → Verificar en dashboard
- Agregar reglas → Verificar en Odoo
- Asignar lista a cliente → Verificar en Odoo

---

## CONTACTO Y RECURSOS

- **Repo GitHub:** https://github.com/frankzuuia/fivevegetables.git
- **Supabase Dashboard:** https://supabase.com/dashboard/project/tansqtlmfhsgkhsiqbyf
- **Odoo Instance:** https://fiveprueba.odoo.com
- **Usuario Odoo:** frankzuuia@gmail.com

---

## NOTAS IMPORTANTES

1. **Error de Hydration:** Causado por extensiones del navegador, ignorar en desarrollo
2. **Cache Next.js:** Si cambios no se reflejan, borrar carpeta `.next` y reiniciar
3. **Turbopack:** Compilación rápida pero a veces necesita reinicio completo
4. **React Query:** Cacheado agresivo, usar `invalidateQueries` después de mutations

---

**ÚLTIMA ACTUALIZACIÓN:** 2026-01-07 17:30 CST
**ESTADO:** Proyecto funcional excepto botón de sincronización Odoo→Dashboard
