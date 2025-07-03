'use client';

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState 
} from 'react';
import { 
  User,
  Session,
  SupabaseClient
} from '@supabase/supabase-js';
import { createBrowserClient } from './supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isRememberMeEnabled } from './auth-utils';

type SupabaseContext = {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContext | undefined>(undefined);

export function SupabaseProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [supabase] = useState(() => createBrowserClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
      }
      setSession(data.session);
      setUser(data.user);
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        // Check if remember me was disabled
        const shouldRemember = isRememberMeEnabled();
        if (!shouldRemember) {
          // If remember me is disabled, don't attempt auto-login
          console.log('Auto-login disabled: Remember me is turned off');
          setIsLoading(false);
          return;
        }
        
        // First, check if we have a session in storage
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session) {
          // We have a session, update the state
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Update local state
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
        
        console.log('Auth state change:', event, newSession?.user?.email);
        
        if (event === 'SIGNED_IN' && !newSession?.user?.user_metadata?.has_completed_profile) {
          router.push('/profile-setup');
        } else if (event === 'SIGNED_IN') {
          router.push('/dashboard');
          toast.success(`Welcome back, ${newSession?.user?.user_metadata?.display_name || newSession?.user?.email}`);
        } else if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED') {
          // Session was refreshed, no need to redirect
          console.log('Session refreshed automatically');
        }
      }
    );

    // Check for session expiry and refresh if needed
    const checkSessionInterval = setInterval(() => {
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        // If token expires in less than 5 minutes, refresh it
        if ((expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
          refreshSession();
        }
      }
    }, 60 * 1000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(checkSessionInterval);
    };
  }, [supabase, router, session]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    supabase,
    user,
    session,
    isLoading,
    signOut,
    refreshSession
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 