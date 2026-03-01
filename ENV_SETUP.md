# Environment Variables Setup

Create a `.env.local` file in the root of your project with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Get These Values

### Supabase Keys
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Cloudinary Keys
1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Copy from your account details:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### Cloudinary Upload Preset Setup
1. Go to Cloudinary Dashboard → **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Name it: `gadgetme_uploads`
5. Set **Signing mode** to **Unsigned** (for client-side uploads)
6. Click **Save**

## Important Notes

- Never commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` should only be used server-side
- Keep all API keys secure and rotate them if compromised

