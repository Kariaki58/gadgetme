# Supabase Backend Setup - Complete Guide

## 🎯 Overview

Your application is now set up to use Supabase as the backend database with Cloudinary for image storage. All dummy data has been removed from the POS system, and it's now fully connected to Supabase.

## 📦 Installation

```bash
npm install @supabase/supabase-js @supabase/ssr cloudinary
```

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase-setup.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify tables were created in **Table Editor**

## ☁️ Cloudinary Setup

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Navigate to **Settings** → **Upload**
3. Scroll to **Upload presets**
4. Click **Add upload preset**
5. Configure:
   - **Preset name**: `gadgetme_uploads`
   - **Signing mode**: **Unsigned** (for client-side uploads)
   - **Folder**: `gadgetme/products` (optional)
6. Click **Save**

## 📋 Database Schema

### Tables Created:
- `stores` - Store information
- `products` - Product catalog with base stock
- `product_variants` - Color variants with individual stock
- `orders` - Customer orders
- `order_items` - Order line items
- `pos_transactions` - POS sales
- `pos_transaction_items` - POS transaction items

### Key Features:
- ✅ Product variants (colors only) with stock per variant
- ✅ Base stock + variant stock tracking
- ✅ Automatic timestamp updates
- ✅ Row Level Security (RLS) policies
- ✅ Proper indexes for performance

## 🔌 API Endpoints Created

- `GET/POST /api/products` - List/Create products
- `GET/PUT/DELETE /api/products/[id]` - Product CRUD
- `GET/POST/PUT /api/stores` - Store operations
- `POST/GET /api/pos/transactions` - POS transactions
- `POST /api/upload` - Image uploads

## ✅ What's Working

- ✅ POS System - Fully connected to Supabase
- ✅ Product variants support (colors with stock)
- ✅ Image upload infrastructure
- ✅ Database schema and relationships
- ✅ API routes for all operations

## ⚠️ Still Needs Updates

The following pages still use localStorage and need to be updated:
- Products management page (needs image upload UI + variants UI)
- Store catalog page
- Cart/checkout pages
- Orders management page

## 🚀 Testing

1. Start your dev server: `npm run dev`
2. Navigate to Dashboard → POS System
3. Products should load from Supabase (empty initially)
4. Add products via API or update products page

## 📚 Documentation Files

- `SUPABASE_SETUP.md` - Detailed setup instructions
- `ENV_SETUP.md` - Environment variables guide
- `supabase-setup.sql` - Database schema script
- `IMPLEMENTATION_SUMMARY.md` - What's been implemented

## 🆘 Troubleshooting

### "Store not loaded" error
- Check that your store ID exists in Supabase
- Verify RLS policies allow access
- Check browser console for errors

### Image upload fails
- Verify Cloudinary upload preset exists
- Check CLOUDINARY_CLOUD_NAME is correct
- Ensure upload preset is set to "Unsigned"

### Products not showing
- Check Supabase connection
- Verify store_id matches
- Check RLS policies

