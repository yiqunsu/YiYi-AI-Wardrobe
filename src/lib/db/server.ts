/**
 * Server-side Supabase client factory (anon key + user Bearer token).
 * Use in API route handlers to perform RLS-protected database operations
 * on behalf of the authenticated user.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set"
  );
}

export function createSupabaseClient(accessToken: string | null) {
  const options = accessToken
    ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    : {};
  return createClient(supabaseUrl, supabaseAnonKey, options);
}
