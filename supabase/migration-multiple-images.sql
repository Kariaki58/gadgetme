-- Migration: Update products table to support multiple images
-- Run this in your Supabase SQL Editor

-- Check if column exists and handle both scenarios
DO $$
BEGIN
  -- Check if image_url column exists (old format)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'image_url'
  ) THEN
    -- Migrate existing data: convert single URLs to arrays
    UPDATE products 
    SET image_url = NULL 
    WHERE image_url IS NULL OR image_url = '';

    -- Alter the column to TEXT[] array
    ALTER TABLE products 
    ALTER COLUMN image_url TYPE TEXT[] 
    USING CASE 
      WHEN image_url IS NULL OR image_url = '' THEN ARRAY[]::TEXT[]
      ELSE ARRAY[image_url]::TEXT[]
    END;

    -- Rename column to image_urls for clarity
    ALTER TABLE products 
    RENAME COLUMN image_url TO image_urls;
    
  ELSIF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'image_urls'
  ) THEN
    -- If neither column exists, create image_urls as TEXT[]
    ALTER TABLE products 
    ADD COLUMN image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

