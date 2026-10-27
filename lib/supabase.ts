import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browser: SupabaseClient | null = null;

/**
 * Public browser client (anon key). Row Level Security only lets it read recent
 * sprays for the live wall; everything else is blocked in the database.
 * The full-access server client lives in lib/supabase-server.ts.
 */
export function supabaseBrowser(): SupabaseClient {
  if (!browser) {
    browser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return browser;
}
