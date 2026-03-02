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

    // Validate Flutterwave configuration
    if (!FLUTTERWAVE_SECRET_KEY) {
      console.error('FLUTTERWAVE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Prepare Flutterwave payment request
    // Using the standard payments endpoint with redirect
    const flutterwavePaymentPayload = {
      tx_ref: `subscription-${subscription.id}-${Date.now()}`,
      amount: amount,
      currency: 'NGN',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/verify`,
      payment_options: 'card,account,ussd,mpesa,mobilemoney',
      customer: {
        email: store.owner_email,
        phonenumber: store.whatsapp_number || '',
        name: store.store_name,
      },
      customizations: {
        title: 'GadgetMe Subscription',
        description: `Subscribe to ${planName} - ₦${amount.toLocaleString()}`,
        logo: 'https://res.cloudinary.com/duswkmqbu/image/upload/v1772374931/store-favicon_aytccd.png',
      },
      meta: {
        store_id: store.id,
        user_id: user.id,
        subscription_id: subscription.id,
        plan_type: planType,
      },
    };

    console.log('Creating Flutterwave payment:', {
      url: `${FLUTTERWAVE_BASE_URL}/payments`,
      amount,
      planType,
      tx_ref: flutterwavePaymentPayload.tx_ref,
    });

    // Create Flutterwave payment
    const flutterwaveResponse = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flutterwavePaymentPayload),
    });

    if (!flutterwaveResponse.ok) {
      let errorData;
      const contentType = flutterwaveResponse.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await flutterwaveResponse.json();
        } else {
          const errorText = await flutterwaveResponse.text();
          errorData = { message: errorText };
        }
      } catch (parseError) {
        const errorText = await flutterwaveResponse.text().catch(() => 'Unknown error');
        errorData = { message: errorText };
      }
      
      console.error('Flutterwave error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create payment link', details: errorData },
        { status: 500 }
      );
    }

    let paymentData;
    try {
      paymentData = await flutterwaveResponse.json();
    } catch (parseError) {
      const errorText = await flutterwaveResponse.text().catch(() => 'Failed to parse response');
      console.error('Failed to parse Flutterwave response:', errorText);
      return NextResponse.json(
        { error: 'Invalid response from payment provider', details: errorText },
        { status: 500 }
      );
    }

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
        flutterwave_subscription_id: paymentData.data.tx_ref || paymentData.data.id?.toString(),
        flutterwave_customer_email: store.owner_email,
        amount_paid: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // Flutterwave payments endpoint returns data.link for the checkout URL
    return NextResponse.json({
      checkoutUrl: paymentData.data.link || paymentData.data.authorization_url,
      paymentId: paymentData.data.id || paymentData.data.tx_ref,
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

