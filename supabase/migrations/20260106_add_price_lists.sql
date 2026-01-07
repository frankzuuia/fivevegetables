-- =====================================================
-- MIGRATION: Add Price Lists Support
-- Sincronización bidireccional con Odoo
-- =====================================================

-- Tabla principal de listas de precios
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odoo_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'MXN',
  active BOOLEAN DEFAULT true,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  type TEXT DEFAULT 'standard', -- 'standard', 'wholesale', 'retail'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reglas detalladas de precios
CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE,
  odoo_id INTEGER UNIQUE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  min_quantity DECIMAL DEFAULT 0,
  date_start DATE,
  date_end DATE,
  compute_price TEXT DEFAULT 'percentage', -- 'fixed', 'percentage', 'formula'
  fixed_price DECIMAL(10,2),
  percent_price DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_price_lists_store ON price_lists(store_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_odoo ON price_lists(odoo_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_list ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product ON price_list_items(product_id);

-- Agregar columna price_list_id a clients_mirror
ALTER TABLE clients_mirror 
ADD COLUMN IF NOT EXISTS price_list_id UUID REFERENCES price_lists(id);

CREATE INDEX IF NOT EXISTS idx_clients_price_list ON clients_mirror(price_list_id);

-- RLS Policies
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver listas de su tienda
CREATE POLICY "Users can view price lists from their store" ON price_lists
  FOR SELECT
  USING (
    store_id IN (
      SELECT (user_metadata->>'store_id')::UUID 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Usuarios pueden crear listas en su tienda
CREATE POLICY "Users can create price lists in their store" ON price_lists
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT (user_metadata->>'store_id')::UUID 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Usuarios pueden actualizar listas de su tienda
CREATE POLICY "Users can update price lists from their store" ON price_lists
  FOR UPDATE
  USING (
    store_id IN (
      SELECT (user_metadata->>'store_id')::UUID 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Policy: Ver items de listas de su tienda
CREATE POLICY "Users can view price list items from their store" ON price_list_items
  FOR SELECT
  USING (
    price_list_id IN (
      SELECT id FROM price_lists WHERE store_id IN (
        SELECT (user_metadata->>'store_id')::UUID 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  );
