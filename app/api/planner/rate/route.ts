import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { recipe_id, plan_id, rating } = await req.json();
  if (!recipe_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "recipe_id and rating (1-5) are required" }, { status: 400 });
  }

  const { error } = await supabase.from("recipe_ratings").upsert({
    user_id: user.id,
    recipe_id,
    plan_id: plan_id ?? null,
    rating,
  }, { onConflict: "user_id,recipe_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
