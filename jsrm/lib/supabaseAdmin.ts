// SERVER-ONLY: never import this file from a client component.
// (We avoid `import "server-only"` to keep deps minimal; runtime guard below.)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (typeof window !== "undefined") {
  throw new Error("supabaseAdmin must not be imported in client code");
}

let cached: SupabaseClient | null = null;

// Server-side ONLY. Do NOT import this from any client component.
// Uses the service role key, which bypasses RLS.
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
