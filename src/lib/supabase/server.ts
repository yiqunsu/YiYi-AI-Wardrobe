import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set"
  );
}

/** 创建带用户 token 的 Supabase 客户端，用于 API 路由中执行受 RLS 保护的操作 */
export function createSupabaseClient(accessToken: string | null) {
  const options = accessToken
    ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    : {};
  return createClient(supabaseUrl, supabaseAnonKey, options);
}
