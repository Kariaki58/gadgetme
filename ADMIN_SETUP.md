# Admin Dashboard Setup

## How to Access the Admin Dashboard

The admin dashboard is located at: **`/admin/referrals`**

## Setting Up Admin Access

To grant admin access to specific users, you need to add their email addresses to your environment variables.

### Step 1: Add Admin Emails to `.env.local`

Add the following line to your `.env.local` file:

```env
NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com,another-admin@example.com
```

**Note:** You can add multiple admin emails by separating them with commas.

### Step 2: Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

### Step 3: Access the Admin Dashboard

1. **Log in** with an admin email address
2. Navigate to: `http://localhost:3000/admin/referrals`

## Admin Dashboard Features

The admin dashboard allows you to:

- **View Statistics:**
  - Total referrers
  - Total referrals
  - Pending payments amount
  - Total paid amount

- **Manage Referral Earnings:**
  - View all referral earnings
  - Search and filter by status (pending/paid)
  - See referrer and referred user details
  - View bank account information

- **Process Payments:**
  - Mark payments as paid
  - Add payment notes
  - Track payment dates

## Security Note

⚠️ **Important:** The current implementation checks admin access on the client side. For production, consider implementing server-side admin checks for better security.

## Alternative: Direct URL Access

If you want to allow access without email checking (for development/testing), you can temporarily comment out the admin check in `/src/app/admin/referrals/page.tsx`, but **remember to re-enable it before production**.

