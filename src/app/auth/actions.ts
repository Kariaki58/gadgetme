'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = (formData.get('next') as string) || '/dashboard';

  console.log(`[ACTION] Attempting login for: ${email}`);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`[ACTION] Login failed for ${email}:`, error.message);
    return { error: error.message };
  }

  console.log(`[ACTION] Login success for ${email}, user found: ${data.user?.id}. Session exists: ${!!data.session}. Redirecting to: ${next}`);
  
  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signup(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const storeName = formData.get('storeName') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const referralCode = (formData.get('referralCode') as string)?.toUpperCase().trim() || null;

  const supabase = await createClient();

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user account.' };
  }

  const adminClient = createAdminClient();

  // 2. Create the user profile in public.users
  // Wait a moment to ensure user is fully committed to auth.users
  // This is important when email confirmation is enabled
  await new Promise(resolve => setTimeout(resolve, 300));

  // Use upsert to handle case where profile might already exist
  const { error: profileError } = await adminClient
    .from('users')
    .upsert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      phone: phone,
    }, {
      onConflict: 'id'
    });

  if (profileError) {
    console.error('[AUTH ACTIONS] Profile creation error:', profileError);
    // If it's a foreign key error, the user might not exist in auth.users yet
    // This can happen if email confirmation is required
    if (profileError.code === '23503') {
      // Wait longer and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { error: retryError } = await adminClient
        .from('users')
        .upsert({
          id: authData.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
        }, {
          onConflict: 'id'
        });
      
      if (retryError) {
        console.error('[AUTH ACTIONS] Profile creation retry error:', retryError);
        // Continue anyway - user can log in later
      }
    }
  }

  // 3. Create the store
  try {
    const generateStoreId = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 7; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let storeId = generateStoreId();
    
    const { data: existing } = await adminClient
      .from('stores')
      .select('id')
      .eq('store_id', storeId)
      .maybeSingle();
    
    if (existing) {
      storeId = generateStoreId();
    }

    // Additional wait to ensure user is fully committed to database
    await new Promise(resolve => setTimeout(resolve, 200));

    let storeData;
    const { data: createdStore, error: storeError } = await adminClient
      .from('stores')
      .insert({
        user_id: authData.user.id,
        store_id: storeId,
        store_name: storeName,
        owner_email: email,
      })
      .select()
      .single();

    if (storeError) {
      console.error('[AUTH ACTIONS] Store creation error:', storeError);
      
      // If it's a foreign key error, try to ensure user profile exists
      if (storeError.code === '23503' && storeError.message?.includes('users')) {
        // The users table foreign key failed - user might not exist in auth.users yet
        // This can happen if email confirmation is enabled
        // Wait a bit longer and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Ensure user profile exists
        await adminClient
          .from('users')
          .upsert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            phone: phone,
          }, {
            onConflict: 'id'
          });
      }
      
      // Retry store creation
      const { data: retryStore, error: retryError } = await adminClient
        .from('stores')
        .insert({
          user_id: authData.user.id,
          store_id: storeId,
          store_name: storeName,
          owner_email: email,
        })
        .select()
        .single();
      
      if (retryError) {
        console.error('[AUTH ACTIONS] Store creation retry error:', retryError);
        return { error: 'Account created, but failed to initialize store. Please try logging in.' };
      }
      
      storeData = retryStore;
    } else {
      storeData = createdStore;
    }

    // 4. Create subscription directly (no triggers)
    // Create expired subscription - user must pay immediately to activate
    if (storeData) {
      const { error: subscriptionError } = await adminClient
        .from('subscriptions')
        .insert({
          store_id: storeData.id,
          user_id: authData.user.id,
          plan_type: 'monthly',
          status: 'expired',
        });

      if (subscriptionError) {
        console.error('[AUTH ACTIONS] Subscription creation error:', subscriptionError);
        // Don't fail signup if subscription creation fails - user can create it later
      }
    }

    // Create referral code for the new user
    const generateReferralCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let refCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await adminClient
        .from('referral_codes')
        .select('id')
        .eq('code', refCode)
        .maybeSingle();
      
      if (!existing) break;
      refCode = generateReferralCode();
      attempts++;
    }

    // Create referral code for new user (they are a vendor)
    await adminClient
      .from('referral_codes')
      .insert({
        user_id: authData.user.id,
        code: refCode,
        is_vendor: true,
      });

    // Track referral if code was provided
    if (referralCode) {
      const { data: referrerCode } = await adminClient
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode)
        .maybeSingle();

      if (referrerCode && referrerCode.user_id !== authData.user.id) {
        // Record the referral
        await adminClient
          .from('referral_registrations')
          .insert({
            referrer_user_id: referrerCode.user_id,
            referred_user_id: authData.user.id,
            referral_code: referralCode,
            referred_store_id: storeData.id,
          });
      }
    }

  } catch (err) {
    console.error('[AUTH ACTIONS] Unexpected error during store creation:', err);
  }

  revalidatePath('/', 'layout');
  
  if (!authData.user.email_confirmed_at && authData.session === null) {
    return { success: true, requiresVerification: true, email };
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
