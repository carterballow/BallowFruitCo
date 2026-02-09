import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { generateWeeklyPlan, CartItem, UserPrefs } from "@/lib/planner";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { cartItems, weekStart } = await req.json() as {
    cartItems: CartItem[];
    weekStart: string;
  };

  if (!cartItems?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const { data: prefsData } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const prefs: UserPrefs = prefsData ?? {
    dietary_goals: [],
    allergies: [],
    meals_per_day: 3,
    skill_level: "beginner",
  };

  const { data: ratingsData } = await supabase
    .from("recipe_ratings")
    .select("recipe_id, rating")
    .eq("user_id", user.id);

  const likedIds = (ratingsData ?? [])
    .filter((r) => r.rating >= 4)
    .map((r) => r.recipe_id);

  let likedTagsMap: Record<string, string[]> = {};
  if (likedIds.length > 0) {
    const { data: likedRecipes } = await supabase
      .from("recipes")
      .select("id, dietary_tags")
      .in("id", likedIds);
    likedTagsMap = Object.fromEntries(
      (likedRecipes ?? []).map((r) => [r.id, r.dietary_tags ?? []])
    );
  }

  const pastRatings = (ratingsData ?? []).map((r) => ({
    recipe_id: r.recipe_id,
    rating: r.rating,
    dietary_tags: likedTagsMap[r.recipe_id] ?? [],
  }));

  const plan = await generateWeeklyPlan(
    cartItems,
    prefs,
    pastRatings,
    new Date(weekStart)
  );

  const { data: savedPlan, error: saveError } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      cart_items: cartItems,
      plan: plan.days,
      week_start: weekStart,
    })
    .select("id")
    .single();

  if (saveError) {
    console.error("Failed to save plan:", saveError.message);
  }

  return NextResponse.json({
    planId: savedPlan?.id ?? null,
    plan: plan.days,
    summary: plan.summary,
    groceryList: plan.groceryList,
    wasteAlerts: plan.wasteAlerts,
    ragContextSummary: plan.ragContextSummary,
  });
}
