# Supabase Setup Guide

## Quick Start

1. **Run the SQL Schema**
   - Go to Supabase Dashboard → SQL Editor
   - Click "New Query"
   - Copy and paste the entire contents of `schema.sql`
   - Click "Run" (Ctrl+Enter)
   - ⚠️ **Warning**: This will DROP all existing tables!

2. **Enable Email Authentication**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - For development: Disable email confirmation in Settings → Email Auth

3. **Set Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Key Features

### Short Store IDs
- Each store gets a **short 7-character ID** (e.g., "abc123")
- Used for public URLs: `/store/abc123/catalog`
- Generated automatically on signup
- Stored in `store_id` column (separate from UUID `id`)

### Database Structure
- `id` (UUID) - Internal database ID for relationships
- `store_id` (TEXT) - Short public ID for URLs
- `user_id` (UUID) - Links to authenticated user

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own store data
- All policies use `auth.uid() = user_id` for proper access control

## Troubleshooting

### Error: "column user_id does not exist"
- This means the old schema is still in place
- Run `schema.sql` to recreate tables with the new structure
- ⚠️ This will delete all existing data!

### Store ID not generating
- Check that the `generate_store_id()` function exists
- Verify the `store_id` column exists in the stores table

### RLS Policy Errors
- Make sure all policies reference `user_id` correctly
- Check that `auth.uid()` is available (user must be authenticated)

