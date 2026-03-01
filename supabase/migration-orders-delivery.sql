-- Migration: Add delivery address fields to orders table
-- Run this in Supabase SQL Editor

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_city TEXT,
ADD COLUMN IF NOT EXISTS delivery_state TEXT,
ADD COLUMN IF NOT EXISTS delivery_country TEXT;

