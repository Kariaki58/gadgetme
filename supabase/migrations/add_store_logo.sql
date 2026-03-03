-- Add logo_url column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN stores.logo_url IS 'URL to the store logo image';

