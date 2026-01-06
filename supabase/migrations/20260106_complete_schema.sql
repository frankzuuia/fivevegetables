-- =====================================================
-- FIVE VEGETABLES - SCHEMA SIMPLIFICADO  
-- Ejecutar PRIMERO este archivo
-- =====================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. STORES (Multi-Tenant)
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
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- =====================================================
-- 2. PROFILES (Usuarios extendidos)
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
  deactivated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_store_id ON profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);

-- =====================================================
-- 3. PRICE_LISTS (Tarifas)
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
-- 4. CLIENTS_MIRROR (Clientes desde Odoo)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients_mirror (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  odoo_partner_id INTEGER UNIQUE NOT NULL,
  
  -- Datos básicos
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Tarifas
  pricelist_id UUID REFERENCES price_lists(id),
  odoo_pricelist_id INTEGER,
  
  -- Dirección ENTREGA
  street VARCHAR(255),
  numero_exterior VARCHAR(50),
  numero_interior VARCHAR(50),
  colonia VARCHAR(255),
  entre_calles VARCHAR(255),
  codigo_postal VARCHAR(5),
  ciudad VARCHAR(100) DEFAULT 'Guadalajara',
  estado VARCHAR(100) DEFAULT 'Jalisco',
  referencias TEXT,
  
  -- Dirección FISCAL (puede ser diferente)
  fiscal_rfc VARCHAR(13),
  fiscal_razon_social VARCHAR(255),
  fiscal_regimen VARCHAR(3),
  fiscal_codigo_postal VARCHAR(5),
  fiscal_ciudad VARCHAR(100),
  fiscal_estado VARCHAR(100),
  fiscal_email VARCHAR(255),
  
  -- Auth sin email (PIN)
  login_method VARCHAR(10) CHECK (login_method IN ('email', 'phone')) DEFAULT 'email',
  login_pin VARCHAR(6),
  pin_sent BOOLEAN DEFAULT false,
  pin_created_at TIMESTAMPTZ,
  
  -- Metadata
  requiere_factura_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_mirror_store_id ON clients_mirror(store_id);
CREATE INDEX IF NOT EXISTS idx_clients_mirror_vendedor_id ON clients_mirror(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_clients_mirror_odoo_id ON clients_mirror(odoo_partner_id);
CREATE INDEX IF NOT EXISTS idx_clients_mirror_login_method ON clients_mirror(login_method);
CREATE INDEX IF NOT EXISTS idx_clients_mirror_pin_sent ON clients_mirror(pin_sent) WHERE pin_sent = false;

-- =====================================================
-- 5. VENDEDOR_CLIENTES (Asignación)
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
-- 6. PRODUCTS_CACHE (Productos desde Odoo)
-- =====================================================
CREATE TABLE IF NOT EXISTS products_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  odoo_product_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  category TEXT,
  unit_of_measure TEXT DEFAULT 'kg',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_cache_store_id ON products_cache(store_id);
CREATE INDEX IF NOT EXISTS idx_products_cache_odoo_id ON products_cache(odoo_product_id);
CREATE INDEX IF NOT EXISTS idx_products_cache_active ON products_cache(active);

-- =====================================================
-- 7. ORDERS_SHADOW (Pedidos)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders_shadow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  odoo_order_id INTEGER UNIQUE,
  cliente_id UUID REFERENCES clients_mirror(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  
  -- Estados
  status TEXT NOT NULL DEFAULT 'draft',
  invoice_status TEXT DEFAULT 'no',
  invoice_pdf_url TEXT,
  
  -- Montos
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Datos entrega (snapshot)
  delivery_contact_name VARCHAR(255),
  delivery_phone VARCHAR(20),
  delivery_restaurant VARCHAR(255),
  delivery_street VARCHAR(255),
  delivery_colonia VARCHAR(255),
  delivery_codigo_postal VARCHAR(5),
  delivery_referencias TEXT,
  
  -- Datos factura (snapshot)
  invoice_rfc VARCHAR(13),
  invoice_razon_social VARCHAR(255),
  invoice_codigo_postal_fiscal VARCHAR(5),
  invoice_generated_at TIMESTAMPTZ,
  
  -- Flags
  request_invoice BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_shadow_store_id ON orders_shadow(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_shadow_cliente_id ON orders_shadow(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orders_shadow_vendedor_id ON orders_shadow(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_orders_shadow_status ON orders_shadow(status);
CREATE INDEX IF NOT EXISTS idx_orders_shadow_created_at ON orders_shadow(created_at DESC);

-- =====================================================
-- 8. ORDER_ITEMS (Items del pedido)
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
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- FUNCIONES HELPER
-- =====================================================

CREATE OR REPLACE FUNCTION generate_login_pin()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger auto-generar PIN
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

CREATE TRIGGER trigger_auto_generate_pin
  BEFORE INSERT ON clients_mirror
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_pin();

-- =====================================================
-- RLS POLICIES  
-- =====================================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_mirror ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_shadow ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedor_clientes ENABLE ROW LEVEL SECURITY;

-- Profiles: usuarios ven su propio perfil
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Stores: acceso por owner  
CREATE POLICY stores_select ON stores
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.store_id = stores.id AND profiles.id = auth.uid())
  );

-- Products: acceso por store
CREATE POLICY products_select ON products_cache
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.store_id = products_cache.store_id AND profiles.id = auth.uid())
  );
