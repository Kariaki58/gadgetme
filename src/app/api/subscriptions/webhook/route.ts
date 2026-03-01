import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH;

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('verif-hash');
    
    // Verify webhook signature if secret hash is set
    if (FLUTTERWAVE_SECRET_HASH && signature !== FLUTTERWAVE_SECRET_HASH) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event, data } = body;

    console.log('Flutterwave webhook received:', { event, data });

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Handle successful payment
    if (event === 'charge.completed' && data.status === 'successful') {
      const { store_id, subscription_id, plan_type } = data.meta || {};

      if (!store_id || !subscription_id) {
        console.error('Missing metadata in webhook:', data);
        return NextResponse.json(
          { error: 'Missing required metadata' },
          { status: 400 }
        );
      }

      // Calculate period dates
      const now = new Date();
      const periodStart = now;
      let periodEnd: Date;

      if (plan_type === 'monthly') {
        periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (plan_type === 'yearly') {
        periodEnd = new Date(now);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        return NextResponse.json(
          { error: 'Invalid plan type' },
          { status: 400 }
        );
      }

      // Update subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_type: plan_type,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          amount_paid: parseFloat(data.amount || '0'),
          flutterwave_subscription_id: data.id?.toString() || data.tx_ref,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription_id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      console.log('Subscription updated successfully:', subscription_id);
    }

    // Handle subscription cancellation or failure
    if (event === 'subscription.cancelled' || (event === 'charge.completed' && data.status === 'failed')) {
      const { subscription_id } = data.meta || {};

      if (subscription_id) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET for webhook verification
export async function GET() {
  return NextResponse.json({ message: 'Flutterwave webhook endpoint' });
}

