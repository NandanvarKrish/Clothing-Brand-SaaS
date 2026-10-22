-- ==============================================================================
-- MIGRATION: 20261018000004_product_management.sql
-- DESCRIPTION: Product catalog extensions: status (draft/published/archived),
--              tags array, primary image flags, and inventory audit helpers.
-- ==============================================================================

-- 1. EXTEND PRODUCTS TABLE
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- 2. EXTEND PRODUCT IMAGES TABLE
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- 3. ENSURE INDEXES ON STATUS & TAGS
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- 4. UPDATE STATUS BASED ON IS_ACTIVE FOR EXISTING SEED PRODUCTS
UPDATE products SET status = 'published' WHERE is_active = true AND status IS NULL;
UPDATE products SET status = 'draft' WHERE is_active = false AND status IS NULL;
