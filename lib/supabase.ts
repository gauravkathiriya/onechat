import { createClient } from '@supabase/supabase-js';

// These env variables must be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// For server-side usage
export const createServerClient = () => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
};

// For client-side usage
export const createBrowserClient = () => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        storageKey: 'onechat-auth-token',
        storage: {
          getItem: (key) => {
            if (typeof window !== 'undefined') {
              return localStorage.getItem(key);
            }
            return null;
          },
          setItem: (key, value) => {
            if (typeof window !== 'undefined') {
              localStorage.setItem(key, value);
            }
          },
          removeItem: (key) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(key);
            }
          },
        },
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  );
}; 