-- =====================================================
-- MIGRACIÓN: Campos Adicionales Flujo Pedidos + Facturación
-- Fecha: 2026-01-05
-- =====================================================

-- =====================================================
-- 1. PROFILES: Gestión Vendedores (activar/desactivar)
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN profiles.active IS 'Vendedor activo o desactivado (soft delete)';
COMMENT ON COLUMN profiles.deactivated_at IS 'Fecha cuando se desactivó el vendedor';
COMMENT ON COLUMN profiles.deactivated_by IS 'Gerente que desactivó al vendedor';

-- =====================================================
-- 2. CLIENTS_MIRROR: Sistema PIN + Dirección Fiscal
-- =====================================================

ALTER TABLE clients_mirror ADD COLUMN IF NOT EXISTS
  -- Sistema de Login con PIN (para clientes sin email)
  login_method VARCHAR(10) CHECK (login_method IN ('email', 'phone')) DEFAULT 'email',
  login_pin VARCHAR(6),
  pin_sent BOOLEAN DEFAULT false,
  pin_created_at TIMESTAMPTZ,
  
  -- Dirección de Entrega (ya existe parcialmente, agregamos faltantes)
  street VARCHAR(255),
  numero_exterior VARCHAR(50),
  numero_interior VARCHAR(50),
  colonia VARCHAR(255),
  entre_calles VARCHAR(255),
  codigo_postal VARCHAR(5),
  ciudad VARCHAR(100) DEFAULT 'Guadalajara',
  estado VARCHAR(100) DEFAULT 'Jalisco',
  referencias TEXT,
  
  -- Dirección FISCAL (diferente a dirección de entrega)
  fiscal_street VARCHAR(255),
  fiscal_numero_exterior VARCHAR(50),
  fiscal_numero_interior VARCHAR(50),
  fiscal_colonia VARCHAR(255),
  fiscal_codigo_postal VARCHAR(5),
  fiscal_ciudad VARCHAR(100),
  fiscal_estado VARCHAR(100),
  
  -- Datos Fiscales CFDI
  fiscal_rfc VARCHAR(13),
  fiscal_razon_social VARCHAR(255),
  fiscal_regimen VARCHAR(3),
  fiscal_uso_cfdi_default VARCHAR(3) DEFAULT 'G01',
  fiscal_email VARCHAR(255),
  
  -- Checkbox "Requiere Factura" (guardado en cliente)
  requiere_factura_default BOOLEAN DEFAULT false;

COMMENT ON COLUMN clients_mirror.login_method IS 'Método de login: email (Supabase Auth) o phone (PIN manual)';
COMMENT ON COLUMN clients_mirror.login_pin IS 'PIN de 4-6 dígitos para login sin email';
COMMENT ON COLUMN clients_mirror.pin_sent IS 'Gerente marcó PIN como enviado por WhatsApp';
COMMENT ON COLUMN clients_mirror.street IS 'Dirección de ENTREGA (puede ser diferente a fiscal)';
COMMENT ON COLUMN clients_mirror.fiscal_rfc IS 'RFC para facturación (Constancia Situación Fiscal SAT)';
COMMENT ON COLUMN clients_mirror.fiscal_codigo_postal IS 'CP del domicilio FISCAL (puede diferir del de entrega)';

-- =====================================================
-- 3. ORDERS_SHADOW: Datos de Entrega en Pedido
-- =====================================================

ALTER TABLE orders_shadow ADD COLUMN IF NOT EXISTS
  -- Datos de entrega capturados en el pedido
  delivery_contact_name VARCHAR(255),
  delivery_phone VARCHAR(20),
  delivery_restaurant VARCHAR(255),
  delivery_street VARCHAR(255),
  delivery_numero_exterior VARCHAR(50),
  delivery_numero_interior VARCHAR(50),
  delivery_colonia VARCHAR(255),
  delivery_entre_calles VARCHAR(255),
  delivery_codigo_postal VARCHAR(5),
  delivery_ciudad VARCHAR(100),
  delivery_estado VARCHAR(100),
  delivery_referencias TEXT,
  
  -- Datos fiscales usados en la factura (snapshot)
  invoice_rfc VARCHAR(13),
  invoice_razon_social VARCHAR(255),
  invoice_regimen_fiscal VARCHAR(3),
  invoice_codigo_postal_fiscal VARCHAR(5),
  invoice_estado_fiscal VARCHAR(100),
  invoice_uso_cfdi VARCHAR(3),
  invoice_email VARCHAR(255),
  invoice_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN orders_shadow.delivery_contact_name IS 'Nombre contacto para entrega';
COMMENT ON COLUMN orders_shadow.invoice_rfc IS 'RFC usado para generar factura (snapshot momento facturación)';
COMMENT ON COLUMN orders_shadow.invoice_generated_at IS 'Timestamp cuando se generó la factura';

-- =====================================================
-- 4. Índices para búsquedas frecuentes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clients_mirror_login_method ON clients_mirror(login_method);
CREATE INDEX IF NOT EXISTS idx_clients_mirror_pin_sent ON clients_mirror(pin_sent) WHERE pin_sent = false;
CREATE INDEX IF NOT EXISTS idx_clients_mirror_fiscal_rfc ON clients_mirror(fiscal_rfc);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_cp ON orders_shadow(delivery_codigo_postal);

-- =====================================================
-- 5. Función Helper: Generar PIN automático
-- =====================================================

CREATE OR REPLACE FUNCTION generate_login_pin()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_login_pin() IS 'Genera PIN de 4 dígitos para login sin email';

-- =====================================================
-- 6. Trigger: Auto-generar PIN si login_method = 'phone'
-- =====================================================

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

COMMENT ON TRIGGER trigger_auto_generate_pin ON clients_mirror IS 'Auto-genera PIN si cliente no tiene email';
