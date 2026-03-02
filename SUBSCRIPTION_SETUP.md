# Flutterwave Subscription Setup Guide

This guide will help you set up Flutterwave subscriptions for GadgetMe.

## Prerequisites

1. Flutterwave account (sign up at https://flutterwave.com)
2. Supabase project with the subscriptions table created
3. Environment variables configured

## Step 1: Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migration-subscriptions.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify the `subscriptions` table was created in **Table Editor**

## Step 2: Get Flutterwave API Keys

1. Log in to your Flutterwave dashboard
2. Go to **Settings** → **API Keys**
3. Copy the following:
   - **Secret Key** → `FLUTTERWAVE_SECRET_KEY`
   - **Public Key** → `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Flutterwave Configuration
FLUTTERWAVE_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_public_key_here
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL
```

## Step 4: Test the Setup

1. Start your development server: `npm run dev`
2. Sign up a new store (they'll automatically get a 14-day trial)
3. Wait for trial to expire or manually set subscription status to `expired` in Supabase
4. Try to access the dashboard - you should see the subscription blocker
5. Click "Subscribe Monthly" or "Subscribe Yearly"
6. Complete the payment on Flutterwave
7. You'll be redirected to the payment verification page, which will verify and activate your subscription

## Subscription Plans

- **Trial**: 14 days free (automatically created for new stores)
- **Monthly**: ₦20,000 per month
- **Yearly**: ₦200,000 per year (saves ₦40,000)

## How It Works

1. **Trial Period**: When a store is created, a trial subscription is automatically created with a 14-day period
2. **Subscription Check**: The dashboard layout checks subscription status on every page load
3. **Blocking**: If subscription is expired or trial ended, users see a subscription blocker
4. **Checkout**: Users click subscribe, which creates a Flutterwave payment link
5. **Payment**: Users complete payment on Flutterwave
6. **Verification**: After payment, users are redirected to the verification page which verifies the payment and activates the subscription
7. **Access**: Once active, users can access all dashboard features

## Database Schema

The `subscriptions` table stores:
- Store and user references
- Plan type (trial, monthly, yearly)
- Status (trial, active, expired, cancelled)
- Trial dates
- Current period dates
- Flutterwave subscription ID
- Payment amount

## Troubleshooting

### Subscription not updating after payment
- Check that you completed the payment verification flow
- Verify the payment verification API endpoint is working
- Check server logs for payment verification errors
- Manually verify subscription status in Supabase
- Ensure the redirect URL is correctly configured in Flutterwave

### Users can't access dashboard
- Check subscription status in Supabase
- Verify `isActive` logic in `use-subscription.ts`
- Check that trial end date is set correctly

## Security Notes

- Never expose `FLUTTERWAVE_SECRET_KEY` in client-side code
- Use service role key only in server-side API routes
- Enable RLS on subscriptions table (already done in migration)
- Payment verification is handled server-side for security

