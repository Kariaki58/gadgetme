# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `gadgetme` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (takes 1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 3: Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click "Run" (or press Ctrl+Enter)
5. Verify all tables were created by going to **Table Editor**

## Step 4: Set Up Authentication (Optional but Recommended)

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates if needed
4. For development, you can disable email confirmation in **Settings** → **Auth** → **Email Auth**

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in all the values from Step 2
3. Add Cloudinary credentials (see Cloudinary Setup below)

## Step 6: Cloudinary Setup

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up or log in
3. Go to **Dashboard**
4. Copy:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`
5. Add these to your `.env.local` file

## Step 7: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr cloudinary
```

## Step 8: Test the Setup

1. Start your development server: `npm run dev`
2. Try signing up a new store
3. Check Supabase dashboard to see if data is being created

## Troubleshooting

### RLS (Row Level Security) Issues
If you get permission errors, you may need to temporarily disable RLS for testing:
- Go to **Table Editor** → Select table → **Settings** → Toggle RLS off
- **Note:** Re-enable RLS before going to production!

### Connection Issues
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
- Check that your Supabase project is active (not paused)
- Ensure you're using the correct environment variables

### Image Upload Issues
- Verify Cloudinary credentials are correct
- Check Cloudinary dashboard for upload limits
- Ensure CORS is properly configured in Cloudinary settings

