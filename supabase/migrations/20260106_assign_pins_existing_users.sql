-- =====================================================
-- MIGRATION: Asignar PINs a usuarios existentes
-- Genera PINs aleatorios para todos los profiles que no tengan
-- =====================================================

-- Función para generar PIN de 4 dígitos (si no existe)
CREATE OR REPLACE FUNCTION generate_pin()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Actualizar todos los profiles que no tienen PIN
UPDATE profiles
SET pin_code = generate_pin()
WHERE pin_code IS NULL OR pin_code = '';

-- Asegurar que la columna no acepte NULL en el futuro
ALTER TABLE profiles 
ALTER COLUMN pin_code SET NOT NULL;

-- Crear función para verificar PINs únicos (opcional)
CREATE OR REPLACE FUNCTION ensure_unique_pin()
RETURNS TRIGGER AS $$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
BEGIN
  -- Si el PIN está vacío o es NULL, generar uno nuevo
  IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
    LOOP
      new_pin := generate_pin();
      
      -- Verificar si el PIN ya existe
      SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE pin_code = new_pin 
        AND id != NEW.id
      ) INTO pin_exists;
      
      -- Si no existe, usarlo
      IF NOT pin_exists THEN
        NEW.pin_code := new_pin;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para asegurar PIN en INSERT/UPDATE
DROP TRIGGER IF EXISTS ensure_pin_on_insert ON profiles;
CREATE TRIGGER ensure_pin_on_insert
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_unique_pin();

-- Log de actualización
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM profiles
  WHERE pin_code IS NOT NULL;
  
  RAISE NOTICE 'PINs asignados a % usuarios', updated_count;
END $$;
