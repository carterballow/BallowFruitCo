import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json(data ?? {
    dietary_goals: [],
    allergies: [],
    meals_per_day: 3,
    skill_level: "beginner",
  });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { dietary_goals, allergies, meals_per_day, skill_level } = body;

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    dietary_goals: dietary_goals ?? [],
    allergies: allergies ?? [],
    meals_per_day: meals_per_day ?? 3,
    skill_level: skill_level ?? "beginner",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
