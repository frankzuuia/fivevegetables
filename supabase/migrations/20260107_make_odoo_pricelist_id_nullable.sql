-- Hacer odoo_pricelist_id nullable para permitir listas creadas solo en app
ALTER TABLE price_lists 
ALTER COLUMN odoo_pricelist_id DROP NOT NULL;
