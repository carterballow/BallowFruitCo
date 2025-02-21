import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Original server-only client (used by existing API routes) ───────────────
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing Supabase env vars. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local"
      );
    }
    client = createClient(url, key);
  }
  return client;
}

// ── Server client with session cookie (API routes + server components) ───────
// Reads the logged-in user's session from the request cookie.
export async function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Fails silently in read-only server components — that's fine.
        }
      },
    },
  });
}
