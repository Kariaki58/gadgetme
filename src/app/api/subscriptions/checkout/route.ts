import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planType } = body; // 'monthly' or 'yearly'

    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // Get user's store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('store_id', store.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Calculate amount based on plan
    const amount = planType === 'monthly' ? 20000 : 200000;
    const planName = planType === 'monthly' ? 'Monthly Plan' : 'Yearly Plan';
    const planInterval = planType === 'monthly' ? 'monthly' : 'annually';

    // Create Flutterwave payment link
    const flutterwaveResponse = await fetch(`${FLUTTERWAVE_BASE_URL}/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `GadgetMe ${planName}`,
        description: `Subscription payment for ${store.store_name}`,
        logo: 'https://your-logo-url.com/logo.png', // Update with your logo
        amount: amount,
        currency: 'NGN',
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?payment=success`,
        customer: {
          email: store.owner_email,
          name: store.store_name,
        },
        customizations: {
          title: 'GadgetMe Subscription',
          description: `Subscribe to ${planName} - ₦${amount.toLocaleString()}`,
        },
        meta: {
          store_id: store.id,
          user_id: user.id,
          subscription_id: subscription.id,
          plan_type: planType,
        },
      }),
    });

    if (!flutterwaveResponse.ok) {
      const errorData = await flutterwaveResponse.json();
      console.error('Flutterwave error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create payment link', details: errorData },
        { status: 500 }
      );
    }

    const paymentData = await flutterwaveResponse.json();

    if (paymentData.status !== 'success') {
      return NextResponse.json(
        { error: 'Failed to create payment link', details: paymentData },
        { status: 500 }
      );
    }

    // Update subscription with Flutterwave reference
    await supabase
      .from('subscriptions')
      .update({
        plan_type: planType,
        flutterwave_subscription_id: paymentData.data.id?.toString(),
        flutterwave_customer_email: store.owner_email,
        amount_paid: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    return NextResponse.json({
      checkoutUrl: paymentData.data.link,
      paymentId: paymentData.data.id,
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

