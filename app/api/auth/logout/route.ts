import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();

  // Supabase SSR clears the session cookie automatically.
  return NextResponse.json({ success: true });
}
