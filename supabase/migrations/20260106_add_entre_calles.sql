-- Add entre_calles column to clients_mirror table
-- Migration to support street intersection reference

ALTER TABLE clients_mirror 
ADD COLUMN IF NOT EXISTS entre_calles TEXT;

COMMENT ON COLUMN clients_mirror.entre_calles IS 'Referencias de ubicación entre qué calles se encuentra (opcional)';
