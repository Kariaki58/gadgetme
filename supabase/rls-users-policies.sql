-- Row Level Security (RLS) Policies for Users Table
-- Run this script in your Supabase SQL Editor
-- This enables RLS and creates policies for the users table

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running the script)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;

-- RLS Policy: Users can view their own profile
-- Users can only SELECT their own user record (where id matches auth.uid())
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT
USING (auth.uid() = id);

-- RLS Policy: Users can insert their own profile
-- Users can only INSERT a profile where the id matches their auth.uid()
-- This ensures users can only create their own profile during signup
CREATE POLICY "Users can insert their own profile" ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can update their own profile
-- Users can only UPDATE their own user record
-- This allows users to update their full_name, phone, etc., but not their id or email
CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can delete their own profile
-- Users can only DELETE their own user record
-- Note: This will cascade delete their store due to the foreign key relationship
CREATE POLICY "Users can delete their own profile" ON users
FOR DELETE
USING (auth.uid() = id);

-- Optional: Create an index on users.id for better performance with RLS queries
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Optional: Create an index on users.store_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);

