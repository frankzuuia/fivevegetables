-- =====================================================
-- MIGRACIÓN: Agregar Campos Faltantes a Tablas Existentes
-- Para ejecutar SOBRE el schema que ya tienes
-- =====================================================

-- =====================================================
-- 1. AGREGAR TABLA STORES (Nueva - Multi-Tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- =====================================================
-- 2. AGREGAR TABLA PROFILES (Nueva)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_store_id ON profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- 3. AGREGAR TABLA PRICE_LISTS (Nueva - Reemplaza pricelist_rules)
-- =====================================================
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  odoo_pricelist_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mayorista',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_lists_store_id ON price_lists(store_id);

-- =====================================================
-- 4. MODIFICAR clients_mirror (Agregar columnas)
-- =====================================================

-- Agregar store_id y vendedor_id
ALTER TABLE clients_mirror 
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Dirección ENTREGA completa
ALTER TABLE clients_mirror
  ADD COLUMN IF NOT EXISTS street VARCHAR(255),
  ADD COLUMN IF NOT EXISTS numero_exterior VARCHAR(50),
  ADD COLUMN IF NOT EXISTS numero_interior VARCHAR(50),
  ADD COLUMN IF NOT EXISTS colonia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS entre_calles VARCHAR(255),
  ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5),
  ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100) DEFAULT 'Guadalajara',
  ADD COLUMN IF NOT EXISTS estado VARCHAR(100) DEFAULT 'Jalisco',
  ADD COLUMN IF NOT EXISTS referencias TEXT;

-- Dirección FISCAL (separada)
ALTER TABLE clients_mirror
  ADD COLUMN IF NOT EXISTS fiscal_rfc VARCHAR(13),
  ADD COLUMN IF NOT EXISTS fiscal_razon_social VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fiscal_regimen VARCHAR(3),
  ADD COLUMN IF NOT EXISTS fiscal_codigo_postal VARCHAR(5),
  ADD COLUMN IF NOT EXISTS fiscal_ciudad VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fiscal_estado VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fiscal_email VARCHAR(255);

-- Auth sin email (PIN)
ALTER TABLE clients_mirror
  ADD COLUMN IF NOT EXISTS login_method VARCHAR(10) CHECK (login_method IN ('email', 'phone')) DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS login_pin VARCHAR(6),
  ADD COLUMN IF NOT EXISTS pin_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_created_at TIMESTAMPTZ;

-- Metadata
ALTER TABLE clients_mirror
  ADD COLUMN IF NOT EXISTS requiere_factura_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ DEFAULT NOW();

-- Rename pricelist_id to odoo_pricelist_id (si es necesario)
-- ALTER TABLE clients_mirror RENAME COLUMN pricelist_id TO odoo_pricelist_id_old;
ALTER TABLE clients_mirror ADD COLUMN IF NOT EXISTS pricelist_id_new UUID REFERENCES price_lists(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_mirror_store_id ON clients_mirror(store_id);
CREATE INDEX IF NOT EXISTS idx_clients_mirror_vendedor_id ON clients_mirror(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_clients_mirror_login_method ON clients_mirror(login_method);

-- =====================================================
-- 5. MODIFICAR orders_shadow (Agregar columnas)
-- =====================================================

ALTER TABLE orders_shadow
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clients_mirror(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Datos entrega (snapshot)
ALTER TABLE orders_shadow
  ADD COLUMN IF NOT EXISTS delivery_contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS delivery_restaurant VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_street VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_colonia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_codigo_postal VARCHAR(5),
  ADD COLUMN IF NOT EXISTS delivery_referencias TEXT;

-- Datos factura (snapshot)
ALTER TABLE orders_shadow
  ADD COLUMN IF NOT EXISTS invoice_rfc VARCHAR(13),
  ADD COLUMN IF NOT EXISTS invoice_razon_social VARCHAR(255),
  ADD COLUMN IF NOT EXISTS invoice_codigo_postal_fiscal VARCHAR(5),
  ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMPTZ;

-- Flags adicionales
ALTER TABLE orders_shadow
  ADD COLUMN IF NOT EXISTS request_invoice BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_shadow_store_id ON orders_shadow(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_shadow_cliente_id ON orders_shadow(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orders_shadow_vendedor_id ON orders_shadow(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_orders_shadow_state ON orders_shadow(state);

-- =====================================================
-- 6. RENOMBRAR products_catalog → products_cache
-- =====================================================

-- Opción A: Renombrar tabla
ALTER TABLE IF EXISTS products_catalog RENAME TO products_cache;

-- Opción B: Si ya existe products_cache, solo agregar columnas
ALTER TABLE products_cache
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ DEFAULT NOW();

-- Renombrar columnas si es necesario
-- ALTER TABLE products_cache RENAME COLUMN list_price TO base_price;
-- ALTER TABLE products_cache RENAME COLUMN stock_level TO stock_quantity;
-- ALTER TABLE products_cache RENAME COLUMN uom TO unit_of_measure;

CREATE INDEX IF NOT EXISTS idx_products_cache_store_id ON products_cache(store_id);

-- =====================================================
-- 7. CREAR TABLA order_items (Nueva)
-- =====================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders_shadow(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products_cache(id) ON DELETE CASCADE,
  odoo_product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =====================================================
-- 8. CREAR TABLA vendedor_clientes (Nueva)
-- =====================================================

CREATE TABLE IF NOT EXISTS vendedor_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clients_mirror(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendedor_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_vendedor_clientes_vendedor_id ON vendedor_clientes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendedor_clientes_cliente_id ON vendedor_clientes(cliente_id);

-- =====================================================
-- 9. FUNCIONES Y TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_login_pin()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_pin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.login_method = 'phone' AND NEW.login_pin IS NULL THEN
    NEW.login_pin := generate_login_pin();
    NEW.pin_created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_pin ON clients_mirror;
CREATE TRIGGER trigger_auto_generate_pin
  BEFORE INSERT ON clients_mirror
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_pin();

-- =====================================================
-- 10. HABILITAR RLS EN NUEVAS TABLAS
-- =====================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedor_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (temporal - después se refinan)
DROP POLICY IF EXISTS "Acceso total profiles" ON profiles;
CREATE POLICY "Acceso total profiles" ON profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total stores" ON stores;
CREATE POLICY "Acceso total stores" ON stores FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total price_lists" ON price_lists;
CREATE POLICY "Acceso total price_lists" ON price_lists FOR ALL USING (true);
