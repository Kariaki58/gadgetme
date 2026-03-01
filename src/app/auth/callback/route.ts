import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('[AUTH CALLBACK] Received request:', { code: code ? 'present' : 'missing', next, origin });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log('[AUTH CALLBACK] Code exchanged for session successfully, redirecting to:', next);
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error('[AUTH CALLBACK] Error exchanging code for session:', error.message);
    }
  }

  // return the user to an error page with instructions
  console.log('[AUTH CALLBACK] No code or error occurred, redirecting to login');
  return NextResponse.redirect(new URL('/login?error=auth-callback-failed', request.url));
}
