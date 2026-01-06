-- =====================================================
-- SCRIPT MANUAL: Asignar PINs a usuarios existentes
-- INSTRUCCIONES:
-- 1. Ve a Supabase Studio > SQL Editor
-- 2. Copia y pega este script completo
-- 3. Click en "RUN" para ejecutar
-- =====================================================

-- Paso 1: Crear función para generar PIN (si no existe)
CREATE OR REPLACE FUNCTION generate_pin()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Paso 2: Actualizar todos los profiles sin PIN
DO $$
DECLARE
  profile_record RECORD;
  new_pin TEXT;
  updated_count INTEGER := 0;
BEGIN
  -- Iterar sobre cada profile sin PIN
  FOR profile_record IN 
    SELECT id, full_name, email 
    FROM profiles 
    WHERE pin_code IS NULL OR pin_code = ''
  LOOP
    -- Generar PIN único
    LOOP
      new_pin := generate_pin();
      
      -- Verificar que no exista
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM profiles WHERE pin_code = new_pin
      );
    END LOOP;
    
    -- Asignar PIN
    UPDATE profiles 
    SET pin_code = new_pin 
    WHERE id = profile_record.id;
    
    updated_count := updated_count + 1;
    
    RAISE NOTICE 'PIN asignado a: % (ID: %) - PIN: %', 
      profile_record.full_name, 
      profile_record.id, 
      new_pin;
  END LOOP;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total de PINs asignados: %', updated_count;
  RAISE NOTICE '===========================================';
END $$;

-- Paso 3: Verificar resultados
SELECT 
  role,
  COUNT(*) as total,
  COUNT(pin_code) as con_pin,
  COUNT(*) - COUNT(pin_code) as sin_pin
FROM profiles
GROUP BY role
ORDER BY role;

-- Paso 4: Crear trigger para futuros usuarios (opcional)
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

-- Crear trigger
DROP TRIGGER IF EXISTS ensure_pin_on_insert ON profiles;
CREATE TRIGGER ensure_pin_on_insert
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_unique_pin();

-- Paso 5: Listar todos los usuarios con sus PINs (para verificar)
SELECT 
  id,
  full_name,
  email,
  role,
  pin_code,
  created_at
FROM profiles
ORDER BY role, full_name
LIMIT 50;
