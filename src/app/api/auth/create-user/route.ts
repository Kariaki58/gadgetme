import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, email, phone } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and Email are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Create the public.users profile row
    const { data, error } = await adminClient
      .from('users')
      .insert({
        id: userId,
        full_name: fullName,
        email: email,
        phone: phone,
        role: 'owner', // Default role for signups
      })
      .select()
      .single();

    if (error) {
      console.error('[API CREATE USER] Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[API CREATE USER] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
