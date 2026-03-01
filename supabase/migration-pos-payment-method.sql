-- Migration: Add payment_method to pos_transactions table
-- Run this in Supabase SQL Editor

ALTER TABLE pos_transactions
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer'));

-- Update existing records to default to 'cash'
UPDATE pos_transactions
SET payment_method = 'cash'
WHERE payment_method IS NULL;

