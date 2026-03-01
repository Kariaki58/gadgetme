# Quick Fix for Policy Already Exists Error

## Problem
When running `schema.sql` multiple times, you get:
```
ERROR: 42710: policy "Users can view their own store" for table "stores" already exists
```

## Solution
The `schema.sql` file has been updated to be **idempotent** (safe to run multiple times).

It now includes:
- ✅ `DROP POLICY IF EXISTS` statements for all policies
- ✅ `DROP FUNCTION IF EXISTS` statements for all functions  
- ✅ `DROP TRIGGER IF EXISTS` statements for all triggers

## How to Use

1. **Go to Supabase SQL Editor**
2. **Copy the entire `schema.sql` file**
3. **Paste and Run** - it will now work even if policies/functions/triggers already exist

The script will:
- Drop existing policies, functions, and triggers
- Recreate everything fresh
- Work perfectly on first run or subsequent runs

## Note
⚠️ The script still drops and recreates **tables**, so any existing data will be lost. This is intentional for a clean setup.

