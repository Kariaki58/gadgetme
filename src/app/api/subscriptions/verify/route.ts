import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
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
    const { tx_ref, transaction_id } = body;

    if (!tx_ref && !transaction_id) {
      return NextResponse.json(
        { error: 'Transaction reference or ID is required' },
        { status: 400 }
      );
    }

    if (!FLUTTERWAVE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Verify payment with Flutterwave
    const verifyUrl = transaction_id 
      ? `${FLUTTERWAVE_BASE_URL}/transactions/${transaction_id}/verify`
      : `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${tx_ref}`;

    const flutterwaveResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
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
      
      console.error('Flutterwave verification error:', errorData);
      return NextResponse.json(
        { error: 'Failed to verify payment', details: errorData },
        { status: 500 }
      );
    }

    let verificationData;
    try {
      verificationData = await flutterwaveResponse.json();
    } catch (parseError) {
      const errorText = await flutterwaveResponse.text().catch(() => 'Failed to parse response');
      console.error('Failed to parse Flutterwave verification response:', errorText);
      return NextResponse.json(
        { error: 'Invalid response from payment provider', details: errorText },
        { status: 500 }
      );
    }

    if (verificationData.status !== 'success') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verification failed',
          details: verificationData 
        },
        { status: 200 }
      );
    }

    const paymentData = verificationData.data;
    const isSuccessful = paymentData.status === 'successful' || paymentData.status === 'success';
    
    if (!isSuccessful) {
      return NextResponse.json({
        success: false,
        status: paymentData.status,
        message: paymentData.processor_response || 'Payment was not successful',
      });
    }

    // Extract metadata
    const { store_id, subscription_id, plan_type } = paymentData.meta || {};

    if (!store_id || !subscription_id) {
      console.error('Missing metadata in payment verification:', paymentData);
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required metadata in payment' 
        },
        { status: 400 }
      );
    }

    // Use admin client to update subscription
    const adminSupabase = createAdminClient();

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
        { 
          success: false,
          error: 'Invalid plan type' 
        },
        { status: 400 }
      );
    }

    // Update subscription
    const { error: updateError } = await adminSupabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_type: plan_type,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        amount_paid: parseFloat(paymentData.amount?.toString() || '0'),
        flutterwave_subscription_id: paymentData.id?.toString() || paymentData.tx_ref,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription_id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verified but failed to update subscription',
          details: updateError 
        },
        { status: 500 }
      );
    }

    console.log('Payment verified and subscription updated:', subscription_id);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      subscription_id,
      plan_type,
      amount: paymentData.amount,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

