import { createBrowserClient } from "@supabase/ssr";

// ── Browser client (for "use client" components only) ───────────────────────
// This file is intentionally separate from lib/supabase.ts.
// lib/supabase.ts imports next/headers which is server-only and will crash
// if a client component tries to import it. Keeping the browser client here
// means client components never touch that server-only code.
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key);
}
