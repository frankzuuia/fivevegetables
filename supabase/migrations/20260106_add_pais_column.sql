-- Add pais (country) column to clients_mirror table
-- Set default value to México

ALTER TABLE clients_mirror 
ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'México';

COMMENT ON COLUMN clients_mirror.pais IS 'País del cliente (por defecto México)';
