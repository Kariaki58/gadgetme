import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('storeId');
    const email = searchParams.get('email');

    if (storeId) {
      // Try to find by short store_id first, then by UUID id
      let { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error) {
        // If not found by store_id, try by UUID id
        const { data: dataById, error: errorById } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();
        
        if (errorById) throw errorById;
        data = dataById;
        error = null;
      }

      if (error) throw error;
      return NextResponse.json(data);
    }

    if (email) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_email', email)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Store ID or email is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get user from session first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user_id from request body or session
    const body = await request.json();
    const { storeName, ownerEmail, accountDetails, userId } = body;

    // Use userId from body (passed during signup) or from session
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS for store creation during signup
    // This is safe because we're explicitly setting the user_id
    const adminClient = createAdminClient();

    // Generate short store ID
    const generateStoreId = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 7; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let storeId = generateStoreId();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure store_id is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await adminClient
        .from('stores')
        .select('id')
        .eq('store_id', storeId)
        .single();

      if (!existing) break;
      storeId = generateStoreId();
      attempts++;
    }

    const { data, error } = await adminClient
      .from('stores')
      .insert({
        user_id: targetUserId,
        store_id: storeId,
        store_name: storeName,
        owner_email: ownerEmail,
        account_bank_name: accountDetails?.bankName,
        account_number: accountDetails?.accountNumber,
        account_name: accountDetails?.accountName,
        account_phone: accountDetails?.phoneNumber,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create store' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      storeId, 
      storeName, 
      accountDetails,
      acceptsDelivery,
      acceptsPickup,
      whatsappNumber,
      address,
      city,
      state
    } = body;

    // Verify the store belongs to the user
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id')
      .eq('id', storeId)
      .single();

    if (storeError || !storeData || storeData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized or store not found' },
        { status: 403 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (storeName !== undefined) updateData.store_name = storeName;
    if (accountDetails?.bankName !== undefined) updateData.account_bank_name = accountDetails.bankName;
    if (accountDetails?.accountNumber !== undefined) updateData.account_number = accountDetails.accountNumber;
    if (accountDetails?.accountName !== undefined) updateData.account_name = accountDetails.accountName;
    if (accountDetails?.phoneNumber !== undefined) updateData.account_phone = accountDetails.phoneNumber;
    if (acceptsDelivery !== undefined) updateData.accepts_delivery = acceptsDelivery;
    if (acceptsPickup !== undefined) updateData.accepts_pickup = acceptsPickup;
    if (whatsappNumber !== undefined) updateData.whatsapp_number = whatsappNumber;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;

    const { data, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    );
  }
}

