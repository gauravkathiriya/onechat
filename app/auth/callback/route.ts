import { createServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = createServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    
    // Check if user has completed profile setup
    if (data.user && !data.user.user_metadata?.has_completed_profile) {
      // Redirect new users to profile setup
      return NextResponse.redirect(new URL('/profile-setup', requestUrl.origin));
    } else {
      // Redirect existing users to chat
      return NextResponse.redirect(new URL('/chat', requestUrl.origin));
    }
  }
  
  // Fallback: redirect to home if no code is present
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 