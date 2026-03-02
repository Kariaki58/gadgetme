import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Get admin emails from environment variable
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client to fetch all data
    const adminClient = createAdminClient();

    // Get all referral codes
    const { data: referrers } = await adminClient
      .from('referral_codes')
      .select('user_id');

    // Get all referral registrations
    const { data: referrals } = await adminClient
      .from('referral_registrations')
      .select('id');

    // Get all earnings
    const { data: earningsData } = await adminClient
      .from('referral_earnings')
      .select(`
        id,
        referrer_user_id,
        referred_user_id,
        amount,
        status,
        created_at,
        payment_date,
        payment_notes
      `)
      .order('created_at', { ascending: false });

    // Get user details separately
    const allUserIds = [
      ...new Set([
        ...(earningsData || []).map((e: any) => e.referrer_user_id),
        ...(earningsData || []).map((e: any) => e.referred_user_id),
      ])
    ];

    const { data: users } = await adminClient
      .from('users')
      .select('id, email, full_name')
      .in('id', allUserIds);

    // Get bank account details for referrers
    const referrerUserIds = [...new Set((earningsData || []).map((e: any) => e.referrer_user_id))];
    const { data: bankAccounts } = await adminClient
      .from('referral_bank_accounts')
      .select('user_id, account_name, account_number, bank_name')
      .in('user_id', referrerUserIds);

    // Calculate stats
    const totalReferrers = new Set(referrers?.map(r => r.user_id) || []).size;
    const totalReferrals = referrals?.length || 0;
    const successfulReferrals = earningsData?.length || 0;
    const totalPendingAmount = earningsData?.filter((e: any) => e.status === 'pending')
      .reduce((sum: number, e: any) => sum + parseFloat(e.amount.toString()), 0) || 0;
    const totalPaidAmount = earningsData?.filter((e: any) => e.status === 'paid')
      .reduce((sum: number, e: any) => sum + parseFloat(e.amount.toString()), 0) || 0;
    const totalEarnings = totalPendingAmount + totalPaidAmount;

    // Format earnings
    const usersMap = new Map(users?.map(u => [u.id, u]) || []);
    const bankAccountsMap = new Map(bankAccounts?.map(acc => [acc.user_id, acc]) || []);

    const formattedEarnings = (earningsData || []).map((e: any) => {
      const bankAccount = bankAccountsMap.get(e.referrer_user_id);
      const referrerUser = usersMap.get(e.referrer_user_id);
      const referredUser = usersMap.get(e.referred_user_id);
      return {
        id: e.id,
        referrer_user_id: e.referrer_user_id,
        referrer_email: referrerUser?.email || 'Unknown',
        referrer_name: referrerUser?.full_name || 'Unknown',
        referred_user_email: referredUser?.email || 'Unknown',
        amount: parseFloat(e.amount.toString()),
        status: e.status,
        created_at: e.created_at,
        payment_date: e.payment_date,
        payment_notes: e.payment_notes,
        bank_account_name: bankAccount?.account_name || null,
        bank_account_number: bankAccount?.account_number || null,
        bank_name: bankAccount?.bank_name || null,
      };
    });

    return NextResponse.json({
      stats: {
        totalReferrers,
        totalReferrals,
        successfulReferrals,
        totalPendingAmount,
        totalPaidAmount,
        totalEarnings,
      },
      earnings: formattedEarnings,
    });
  } catch (error: any) {
    console.error('Error fetching admin referral data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { earningId, paymentNotes } = body;

    if (!earningId) {
      return NextResponse.json(
        { error: 'Earning ID is required' },
        { status: 400 }
      );
    }

    // Use admin client to update payment
    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient
      .from('referral_earnings')
      .update({
        status: 'paid',
        payment_date: new Date().toISOString(),
        payment_notes: paymentNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', earningId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update payment', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

