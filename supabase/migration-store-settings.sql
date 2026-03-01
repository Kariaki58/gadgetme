-- Migration: Add store settings fields (delivery options, WhatsApp, address)
-- Run this in Supabase SQL Editor

-- Add delivery options and contact fields to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS accepts_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepts_pickup BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Update existing stores to accept pickup by default
UPDATE stores
SET accepts_pickup = true
WHERE accepts_pickup IS NULL;

