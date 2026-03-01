# Supabase Authentication Implementation

## Overview

The application now uses Supabase for authentication, replacing the previous localStorage-based authentication system. Users can sign up and sign in with email and password, and their stores are automatically linked to their user accounts.

## What Changed

### 1. Database Schema Updates
- **`stores` table**: Added `user_id` column that references `auth.users(id)`
- **RLS Policies**: Updated to use `auth.uid() = user_id` for proper access control
- Users can only access their own store data

### 2. Authentication Context (`src/contexts/auth-context.tsx`)
- New React context providing:
  - `user`: Current authenticated user
  - `session`: Current session
  - `loading`: Loading state
  - `signUp(email, password, storeName)`: Create new account and store
  - `signIn(email, password)`: Sign in existing user
  - `signOut()`: Sign out current user

### 3. Middleware (`src/middleware.ts`)
- Protects `/dashboard/*` routes - redirects to `/login` if not authenticated
- Redirects authenticated users away from `/login` and `/signup` pages
- Handles Supabase session cookies properly

### 4. Updated Pages

#### Login Page (`src/app/(auth)/login/page.tsx`)
- Changed from Store ID input to email/password form
- Uses `useAuth().signIn()` for authentication
- Shows loading state during sign-in

#### Signup Page (`src/app/(auth)/signup/page.tsx`)
- Added password and confirm password fields
- Uses `useAuth().signUp()` which:
  1. Creates user in Supabase Auth
  2. Creates store in database via API route
- Validates password length (minimum 6 characters)

#### Dashboard Layout (`src/app/dashboard/layout.tsx`)
- Uses `useAuth()` instead of `useStoreData().authState`
- Checks for authenticated user before rendering

### 5. Updated Hooks

#### `useStoreDataSupabase` (`src/hooks/use-store-data-supabase.ts`)
- Now uses `useAuth()` to get current user
- Loads store by `user_id` instead of `storeId`
- `addPOSTransaction` no longer requires `storeId` parameter (uses `store.id`)

#### `useStoreDataSupabaseAuth` (`src/hooks/use-store-data-supabase-auth.ts`)
- New hook for dashboard pages that need full store data
- Loads store, products, orders, and POS transactions
- Automatically loads data when user changes

### 6. API Routes

#### `/api/stores` (POST)
- Now requires authentication
- Extracts `user_id` from authenticated session
- Creates store linked to authenticated user

### 7. Sidebar Component
- Updated to use `useStoreDataSupabaseAuth()` instead of `useStoreData()`
- Uses `store.id` instead of `store.storeId` for catalog link
- Shows store name instead of store ID

## Setup Instructions

### 1. Update Supabase Schema

Run the updated `supabase-setup.sql` script in your Supabase SQL Editor. The key change is:

```sql
-- Stores table now includes user_id
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
);
```

### 2. Enable Email Authentication

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. For development, you can disable email confirmation:
   - Go to Authentication → Settings → Email Auth
   - Toggle "Enable email confirmations" OFF (for development only)

### 3. Environment Variables

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Install Dependencies

Already included in `package.json`:
- `@supabase/supabase-js`
- `@supabase/ssr`

## Migration Notes

### For Existing Users

If you have existing stores in localStorage:
1. Users will need to create new accounts
2. They can manually add their products again
3. Or you can create a migration script to import data

### For New Users

1. Sign up with email and password
2. Store is automatically created
3. User is immediately signed in (if email confirmation is disabled)

## Security Features

1. **Row Level Security (RLS)**: All tables have RLS policies ensuring users can only access their own data
2. **Middleware Protection**: Dashboard routes are protected at the middleware level
3. **Server-Side Auth**: API routes verify authentication using Supabase server client
4. **Session Management**: Supabase handles session tokens and refresh automatically

## Testing

1. **Sign Up**:
   - Go to `/signup`
   - Enter store name, email, and password
   - Should create account and redirect to dashboard

2. **Sign In**:
   - Go to `/login`
   - Enter email and password
   - Should sign in and redirect to dashboard

3. **Protected Routes**:
   - Try accessing `/dashboard` without being logged in
   - Should redirect to `/login`

4. **Sign Out**:
   - Click "Sign Out" in sidebar
   - Should sign out and redirect to `/login`

## Troubleshooting

### "User not found" error
- Check that email authentication is enabled in Supabase
- Verify RLS policies are set up correctly

### Store not loading
- Check browser console for errors
- Verify `user_id` is set correctly in stores table
- Check RLS policies allow SELECT for authenticated users

### Signup fails
- Check Supabase logs for errors
- Verify API route has proper authentication
- Check that `user_id` is being set correctly

