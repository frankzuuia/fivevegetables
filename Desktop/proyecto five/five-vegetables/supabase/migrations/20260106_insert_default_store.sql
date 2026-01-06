-- Create default store for Five Vegetables
-- This is required for the multi-tenant setup

INSERT INTO stores (id, name, slug, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Five Vegetables - Guadalajara',
  'five-vegetables-gdl',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
