# Supabase Setup Files

This folder contains all Supabase-related setup files and documentation.

## Files

- `schema.sql` - Complete database schema with RLS policies
- `README.md` - This file

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `schema.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify tables were created by going to **Table Editor**

## Important Notes

- This script will **DROP all existing tables** and recreate them
- Make sure to backup any important data before running
- The `store_id` field is a short 7-character ID (e.g., "abc123") for public URLs
- The `id` field is a UUID used internally for database relationships
- All tables have Row Level Security (RLS) enabled

## Schema Overview

### Stores
- `id` (UUID) - Internal database ID
- `user_id` (UUID) - Links to auth.users
- `store_id` (TEXT) - Short public ID for URLs
- `store_name`, `owner_email`, account details, etc.

### Products
- Linked to stores via `store_id` (UUID)
- Supports variants (colors) with individual stock

### Orders & POS Transactions
- Separate tables for online orders and in-person sales
- Both linked to stores

## RLS Policies

All tables have Row Level Security enabled. Users can only:
- View their own store data
- Insert/update/delete their own store data
- Access products, orders, and transactions from their store only

