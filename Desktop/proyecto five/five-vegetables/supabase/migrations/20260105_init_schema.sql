-- =====================================================
-- FIVE VEGETABLES - SUPABASE SCHEMA
-- B2B Multi-Tenant System with Odoo Integration
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: stores (Multi-Tenant)
-- Cada tienda es un tenant independiente
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

-- Índices para stores
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);

-- =====================================================
-- TABLA: users (Profiles extendidos)
-- Información adicional de usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'cliente', -- gerente, vendedor, cliente
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_store_id ON profiles(store_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =====================================================
-- TABLA: vendedor_clientes (Asignación)
-- Relación vendedor → clientes asignados
-- =====================================================
CREATE TABLE IF NOT EXISTS vendedor_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendedor_id, cliente_id)
);

-- Índices para vendedor_clientes
CREATE INDEX idx_vendedor_clientes_store_id ON vendedor_clientes(store_id);
CREATE INDEX idx_vendedor_clientes_vendedor_id ON vendedor_clientes(vendedor_id);
CREATE INDEX idx_vendedor_clientes_cliente_id ON vendedor_clientes(cliente_id);

-- =====================================================
-- TABLA: price_lists (Tarifas: VIP, Mayorista)
-- Espejo de Odoo product.pricelist
-- =====================================================
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  odoo_pricelist_id INTEGER UNIQUE NOT NULL, -- ID de Odoo
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mayorista', -- vip, mayorista, normal
  discount_percentage DECIMAL(5,2) DEFAULT 0, 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para price_lists
CREATE INDEX idx_price_lists_store_id ON price_lists(store_id);
CREATE INDEX idx_price_lists_odoo_id ON price_lists(odoo_pricelist_id);

-- =====================================================
-- TABLA: clients_mirror (Espejo de Odoo res.partner)
-- Datos de clientes sincronizados desde Odoo
-- =====================================================
CREATE TABLE IF NOT EXISTS clients_mirror (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Solo si tiene cuenta en app
  odoo_partner_id INTEGER UNIQUE NOT NULL, -- ID del partner en Odoo
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  pricelist_id UUID REFERENCES price_lists(id),
  odoo_pricelist_id INTEGER, -- Relación directa con Odoo
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ DEFAULT NOW() -- Última sincronización con Odoo
);

-- Índices para clients_mirror
CREATE INDEX idx_clients_mirror_store_id ON clients_mirror(store_id);
CREATE INDEX idx_clients_mirror_odoo_id ON clients_mirror(odoo_partner_id);
CREATE INDEX idx_clients_mirror_user_id ON clients_mirror(user_id);
CREATE INDEX idx_clients_mirror_pricelist_id ON clients_mirror(pricelist_id);

-- =====================================================
-- TABLA: products_cache (Espejo de Odoo product.product)
-- Productos sincronizados desde Odoo
-- =====================================================
CREATE TABLE IF NOT EXISTS products_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  odoo_product_id INTEGER UNIQUE NOT NULL, -- ID del producto en Odoo
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

-- Índices para products_cache
CREATE INDEX idx_products_cache_store_id ON products_cache(store_id);
CREATE INDEX idx_products_cache_odoo_id ON products_cache(odoo_product_id);
CREATE INDEX idx_products_cache_active ON products_cache(active);

-- =====================================================
-- TABLA: orders_shadow (Espejo de Odoo sale.order)
-- Pedidos sincronizados Odoo ↔ App
-- =====================================================
CREATE TABLE IF NOT EXISTS orders_shadow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  odoo_order_id INTEGER UNIQUE, -- ID del pedido en Odoo (NULL si no sincronizado)
  cliente_id UUID REFERENCES clients_mirror(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE, -- Número de pedido generado
  status TEXT NOT NULL DEFAULT 'draft', -- draft, confirmed, processing, delivered, cancelled
  invoice_status TEXT DEFAULT 'no', -- no, to_invoice, invoiced
  invoice_pdf_url TEXT, -- URL del PDF de factura (si existe)
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  request_invoice BOOLEAN DEFAULT false, -- Cliente solicita factura
  notes TEXT, -- Notas del pedido
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ, -- Última sincronización con Odoo
  delivered_at TIMESTAMPTZ
);

-- Índices para orders_shadow
CREATE INDEX idx_orders_shadow_store_id ON orders_shadow(store_id);
CREATE INDEX idx_orders_shadow_odoo_id ON orders_shadow(odoo_order_id);
CREATE INDEX idx_orders_shadow_cliente_id ON orders_shadow(cliente_id);
CREATE INDEX idx_orders_shadow_vendedor_id ON orders_shadow(vendedor_id);
CREATE INDEX idx_orders_shadow_status ON orders_shadow(status);
CREATE INDEX idx_orders_shadow_created_at ON orders_shadow(created_at DESC);

-- =====================================================
-- TABLA: order_items (Items del pedido)
-- Líneas de pedido
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

-- Índices para order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- RLS POLICIES - ROW LEVEL SECURITY
-- Aislamiento completo por tenant + roles
-- =====================================================

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedor_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_mirror ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_shadow ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: stores
-- =====================================================
CREATE POLICY "Users can view their own store"
  ON stores FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.store_id = stores.id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can create stores"
  ON stores FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their store"
  ON stores FOR UPDATE
  USING (owner_id = auth.uid());

-- =====================================================
-- POLICIES: profiles
-- =====================================================
CREATE POLICY "Users can view profiles from their store"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR -- Ver su propio perfil
    EXISTS (
      SELECT 1 FROM profiles AS my_profile
      WHERE my_profile.id = auth.uid()
      AND my_profile.store_id = profiles.store_id
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- =====================================================
-- POLICIES: vendedor_clientes
-- =====================================================
CREATE POLICY "Vendedores can view their clients"
  ON vendedor_clientes FOR SELECT
  USING (
    vendedor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gerente'
      AND profiles.store_id = vendedor_clientes.store_id
    )
  );

CREATE POLICY "Gerentes can manage vendedor_clientes"
  ON vendedor_clientes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gerente'
      AND profiles.store_id = vendedor_clientes.store_id
    )
  );

-- =====================================================
-- POLICIES: price_lists
-- =====================================================
CREATE POLICY "Users can view price lists from their store"
  ON price_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.store_id = price_lists.store_id
    )
  );

-- =====================================================
-- POLICIES: clients_mirror
-- =====================================================
CREATE POLICY "Users can view clients from their store"
  ON clients_mirror FOR SELECT
  USING (
    user_id = auth.uid() OR -- Ver sus propios datos si es cliente
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.store_id = clients_mirror.store_id
      AND (
        profiles.role = 'gerente'  -- Gerente ve todos
        OR (
          profiles.role = 'vendedor' -- Vendedor ve SUS clientes asignados
          AND EXISTS (
            SELECT 1 FROM vendedor_clientes
            WHERE vendedor_clientes.vendedor_id = auth.uid()
            AND vendedor_clientes.cliente_id = (
              SELECT id FROM profiles WHERE id = clients_mirror.user_id LIMIT 1
            )
          )
        )
      )
    )
  );

-- =====================================================
-- POLICIES: products_cache
-- =====================================================
CREATE POLICY "Users can view products from their store"
  ON products_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.store_id = products_cache.store_id
    )
  );

-- =====================================================
-- POLICIES: orders_shadow
-- =====================================================
CREATE POLICY "Clientes can view their own orders"
  ON orders_shadow FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients_mirror
      WHERE clients_mirror.user_id = auth.uid()
      AND clients_mirror.id = orders_shadow.cliente_id
    )
  );

CREATE POLICY "Vendedores can view orders from their clients"
  ON orders_shadow FOR SELECT
  USING (
    vendedor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gerente'
      AND profiles.store_id = orders_shadow.store_id
    )
  );

CREATE POLICY "Clientes can create orders"
  ON orders_shadow FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients_mirror
      WHERE clients_mirror.user_id = auth.uid()
      AND clients_mirror.id = cliente_id
    )
  );

-- =====================================================
-- POLICIES: order_items
-- =====================================================
CREATE POLICY "Users can view order items from their accessible orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders_shadow
      WHERE orders_shadow.id = order_items.order_id
      AND (
        EXISTS (
          SELECT 1 FROM clients_mirror
          WHERE clients_mirror.user_id = auth.uid()
          AND clients_mirror.id = orders_shadow.cliente_id
        )
        OR
        orders_shadow.vendedor_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'gerente'
          AND profiles.store_id = orders_shadow.store_id
        )
      )
    )
  );

-- =====================================================
-- FUNCIONES HELPER
-- =====================================================

-- Función para obtener el store_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_store_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT store_id
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- =====================================================
-- SEED DATA (Para testing)
-- =====================================================

-- Nota: En producción, esto se poblará desde Odoo via sincronización
-- Este seed es solo para desarrollo local

-- COMENTARIOS DE TABLAS (Opcional - descomentados para evitar errores de orden)
-- COMMENT ON TABLE stores IS 'Tabla de tiendas (multi-tenant). Cada tienda es un tenant independiente.';
-- COMMENT ON TABLE profiles IS 'Perfiles extendidos de usuarios con rol (gerente/vendedor/cliente).';
-- COMMENT ON TABLE vendedor_clientes IS 'Asignación de clientes a vendedores específicos.';
-- COMMENT ON TABLE price_lists IS 'Tarifas de precio (VIP, Mayorista) espejadas desde Odoo.';
-- COMMENT ON TABLE clients_mirror IS 'Clientes espejados desde Odoo res.partner.';
-- COMMENT ON TABLE products_cache IS 'Productos espejados desde Odoo product.product con stock.';
-- COMMENT ON TABLE orders_shadow IS 'Pedidos sincronizados bidireccional con Odoo sale.order.';
-- COMMENT ON TABLE order_items IS 'Líneas de items en cada pedido.';
