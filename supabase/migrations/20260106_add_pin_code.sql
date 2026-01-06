-- Add pin_code column to profiles table
-- PIN de 4 dígitos para login del usuario

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pin_code TEXT CHECK (char_length(pin_code) = 4);

COMMENT ON COLUMN profiles.pin_code IS 'PIN de 4 dígitos para autenticación del usuario';

-- Función para generar PIN aleatorio de 4 dígitos
CREATE OR REPLACE FUNCTION generate_pin()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_pin IS 'Genera un PIN aleatorio de 4 dígitos (0000-9999)';
