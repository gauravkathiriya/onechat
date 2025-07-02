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
    supabaseAnonKey
  );
}; 