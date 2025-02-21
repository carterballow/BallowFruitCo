import { FRUIT_DATA } from "./nutrition";
import { retrieveRecipes, RecipeMatch } from "./rag";
import { generatePlanText } from "./gemini";

// ── Types ────────────────────────────────────────────────────────────────────

export type CartItem = {
  id: string;    // matches FRUIT_DATA keys: "avocados", "blood-oranges", etc.
  name: string;
  quantity: number;
};

export type UserPrefs = {
  dietary_goals: string[];
  allergies: string[];
  meals_per_day: number;   // 2 or 3
  skill_level: string;
};

export type PastRating = {
  recipe_id: string;
  rating: number;  // 1-5
  dietary_tags?: string[];
};

export type DayMeal = {
  meal_type: string;
  recipe_id: string;
  recipe_title: string;
  fruit_used: string[];
};

export type DayPlan = {
  day: number;
  date: string;
  meals: DayMeal[];
};

export type WeeklyPlan = {
  days: DayPlan[];
  summary: string;   // Gemini-generated intro
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function addDays(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function getMealTypes(mealsPerDay: number): string[] {
  if (mealsPerDay === 2) return ["breakfast", "dinner"];
  return ["breakfast", "lunch", "dinner"];
}

// ── Main planner function ─────────────────────────────────────────────────────

export async function generateWeeklyPlan(
  cartItems: CartItem[],
  prefs: UserPrefs,
  pastRatings: PastRating[],
  weekStart: Date
): Promise<WeeklyPlan> {

  // ── Phase 1: Urgency Assignment ──────────────────────────────────────────
  // Sort cart fruits by how soon they'll spoil.
  // Avocados (urgencyScore 10, shelfLife 5 days) go first.
  // Pomegranates (urgencyScore 1, shelfLife 30 days) go last.
  const urgentFruits = cartItems
    .map((item) => {
      const data = FRUIT_DATA[item.id];
      return {
        fruitId: item.id,
        name: item.name,
        urgencyScore: data?.urgencyScore ?? 5,
        latestDay: Math.min(7, data?.shelfLifeDays ?? 14),
      };
    })
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  // ── Phase 2: Build liked/disliked recipe lists from past ratings ─────────
  const dislikedIds = new Set(
    pastRatings.filter((r) => r.rating <= 2).map((r) => r.recipe_id)
  );
  const likedTags = pastRatings
    .filter((r) => r.rating >= 4 && r.dietary_tags?.length)
    .flatMap((r) => r.dietary_tags ?? []);

  // ── Phase 3: RAG Retrieval ────────────────────────────────────────────────
  // Build a query that describes what we're looking for.
  const fruitNames = cartItems.map((i) => i.name).join(", ");
  const goalText = prefs.dietary_goals.length > 0
    ? prefs.dietary_goals.join(", ")
    : "balanced healthy";
  const likedTagText = likedTags.length > 0
    ? ` Preferred style: ${[...new Set(likedTags)].join(", ")}.`
    : "";
  const queryText = `${goalText} recipes using ${fruitNames}, ${prefs.skill_level} cooking skill.${likedTagText}`;

  const fruitIds = cartItems.map((i) => i.id);
  const candidates = await retrieveRecipes(queryText, fruitIds, prefs.allergies, 20);

  // Filter out disliked recipes and boost liked-tag recipes
  const scored = candidates
    .filter((r) => !dislikedIds.has(r.id))
    .map((r) => {
      const tagBoost = r.dietary_tags.filter((t) => likedTags.includes(t)).length * 0.05;
      return { ...r, score: r.similarity + tagBoost };
    })
    .sort((a, b) => b.score - a.score);

  // ── Phase 4: Build empty day slots ───────────────────────────────────────
  const mealTypes = getMealTypes(prefs.meals_per_day);
  const days: Array<{
    day: number;
    date: string;
    meals: Array<{ meal_type: string; assigned: (RecipeMatch & { score: number }) | null }>;
  }> = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    date: addDays(weekStart, i),
    meals: mealTypes.map((mt) => ({ meal_type: mt, assigned: null })),
  }));

  const usedIds = new Set<string>();

  // ── Phase 5: Slot Assignment ──────────────────────────────────────────────
  // For each fruit in urgency order, assign recipes to early-week days.
  for (const fruit of urgentFruits) {
    const fruitCandidates = scored.filter((r) =>
      r.fruit_tags.includes(fruit.fruitId)
    );

    for (const day of days.slice(0, fruit.latestDay)) {
      for (const slot of day.meals) {
        if (slot.assigned) continue;

        const match = fruitCandidates.find(
          (r) =>
            !usedIds.has(r.id) &&
            (r.meal_type.includes(slot.meal_type) || r.meal_type.includes("snack"))
        );

        if (match) {
          slot.assigned = match;
          usedIds.add(match.id);
        }
      }
    }
  }

  // ── Phase 6: Fill remaining empty slots ──────────────────────────────────
  for (const day of days) {
    for (const slot of day.meals) {
      if (slot.assigned) continue;
      const fallback = scored.find(
        (r) =>
          !usedIds.has(r.id) &&
          (r.meal_type.includes(slot.meal_type) || r.meal_type.length > 0)
      );
      if (fallback) {
        slot.assigned = fallback;
        usedIds.add(fallback.id);
      }
    }
  }

  // ── Phase 7: Shape into final plan ───────────────────────────────────────
  const planDays: DayPlan[] = days.map((day) => ({
    day: day.day,
    date: day.date,
    meals: day.meals
      .filter((s) => s.assigned !== null)
      .map((s) => ({
        meal_type: s.meal_type,
        recipe_id: s.assigned!.id,
        recipe_title: s.assigned!.title,
        fruit_used: s.assigned!.fruit_tags,
      })),
  }));

  // ── Phase 8: Gemini Enrichment ────────────────────────────────────────────
  // Ask Gemini to write a short, friendly intro for the plan.
  const urgentFruitName = urgentFruits[0]?.name ?? cartItems[0]?.name ?? "fruit";
  const recipeList = planDays
    .map((d) => `Day ${d.day}: ${d.meals.map((m) => m.recipe_title).join(", ")}`)
    .join("\n");

  const prompt = `You are a friendly meal planning assistant for a family fruit farm called Ballow Fruit Co. in Encinitas, California.

A customer ordered these fruits: ${fruitNames}.

Here is their 7-day recipe plan:
${recipeList}

Write 2-3 sentences as a friendly intro to their plan. Mention that ${urgentFruitName} should be used first. Keep it warm and encouraging. No emojis. Plain text only.`;

  let summary = "";
  try {
    summary = await generatePlanText(prompt);
  } catch {
    // If Gemini fails (rate limit etc.), use a fallback message
    summary = `Your 7-day plan is ready. Start with your ${urgentFruitName} this week — they're best in the first few days. Everything else is scheduled to be used before it spoils.`;
  }

  return { days: planDays, summary };
}
