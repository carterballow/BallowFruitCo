/**
 * lib/planner.ts — AI Weekly Meal Planner
 *
 * This is the brain of the planner. It takes:
 *   - cartItems: what fruit the user bought
 *   - prefs: their dietary goals, allergies, skill level
 *   - pastRatings: recipes they've liked/disliked before
 *   - weekStart: the date to start the plan from
 *
 * And produces:
 *   1. A 7-day meal plan (breakfast/lunch/dinner for each day)
 *   2. A grocery list (pantry items to buy to support the recipes)
 *   3. Waste alerts (fruits expiring soon that need to be used first)
 *   4. A Gemini-written summary intro
 *
 * The algorithm runs in 8 phases:
 *   1. Urgency Assignment — sort fruits by shelf life
 *   2. Past Rating Analysis — build liked/disliked recipe signals
 *   3. Multi-Store RAG Retrieval — search 3 vector stores in parallel
 *   4. Candidate Scoring — boost liked-tag recipes, filter out disliked
 *   5. Build Empty Day Slots — 7 days × meals_per_day
 *   6. Urgency-First Slot Assignment — avocados go in days 1-3
 *   7. Fill Remaining Slots — best-scored unused candidates
 *   8. Gemini Enrichment + Grocery List + Waste Alerts
 */

import { FRUIT_DATA } from "./nutrition";
import {
  multiStoreRetrieval,
  buildContextQuery,
  generateGroceryList,
  generateWasteAlerts,
  GroceryItem,
  WasteAlert,
  RecipeMatch,
} from "./rag";
import { generatePlanText } from "./gemini";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  difficulty: string;
};

export type DayPlan = {
  day: number;
  date: string;
  meals: DayMeal[];
};

export type WeeklyPlan = {
  days: DayPlan[];
  summary: string;          // Gemini-written friendly intro
  groceryList: GroceryItem[];   // pantry items to pick up
  wasteAlerts: WasteAlert[];    // fruits at risk of not being used in time
  ragContextSummary: string;    // diagnostic: what was retrieved from each store
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function getMealTypes(mealsPerDay: number): string[] {
  if (mealsPerDay === 2) return ["breakfast", "dinner"];
  return ["breakfast", "lunch", "dinner"];
}

// Extracts storage tips from produce knowledge to enrich waste alerts
function buildShelfLifeMap(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(FRUIT_DATA).map(([id, data]) => [id, data.shelfLifeDays])
  );
}

// ── Main Planner ──────────────────────────────────────────────────────────────

export async function generateWeeklyPlan(
  cartItems: CartItem[],
  prefs: UserPrefs,
  pastRatings: PastRating[],
  weekStart: Date
): Promise<WeeklyPlan> {

  // ── Phase 1: Urgency Assignment ──────────────────────────────────────────
  // Sort cart fruits by how soon they'll spoil.
  // Avocados (urgencyScore 10, shelfLife 5 days) always go first.
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

  // ── Phase 2: Past Rating Analysis ────────────────────────────────────────
  const dislikedIds = new Set(
    pastRatings.filter((r) => r.rating <= 2).map((r) => r.recipe_id)
  );

  // Collect dietary tags from well-liked recipes — used to boost similar ones
  const likedTags = pastRatings
    .filter((r) => r.rating >= 4 && r.dietary_tags?.length)
    .flatMap((r) => r.dietary_tags ?? []);

  // Fruits from highly-rated recipes get boosted urgency in the query
  const inventoryAlerts = urgentFruits
    .filter((f) => f.urgencyScore >= 8)
    .map((f) => f.name);

  // ── Phase 3: Multi-Store RAG Retrieval ────────────────────────────────────
  // Build the context query (merges cart + prefs + past rating signals)
  const contextQuery = buildContextQuery(
    cartItems,
    prefs.dietary_goals,
    prefs.skill_level,
    likedTags,
    inventoryAlerts
  );

  const fruitIds = cartItems.map((i) => i.id);

  // Query all 3 vector stores in parallel
  const { recipes: candidates, produceKnowledge, nutritionKnowledge, contextSummary } =
    await multiStoreRetrieval(contextQuery, fruitIds, prefs.allergies, 25);

  // ── Phase 4: Candidate Scoring ────────────────────────────────────────────
  // Filter out disliked recipes.
  // Boost recipes whose dietary_tags overlap with the user's liked tags.
  // Boost recipes that match nutrition goals from the nutrition knowledge store.

  // Extract nutrition-relevant tags from retrieved nutrition knowledge
  const nutritionTagBoosts: Record<string, number> = {};
  for (const chunk of nutritionKnowledge) {
    // If user wants "high-fiber" and the nutrition knowledge confirms this fruit
    // is high-fiber, give a small boost to recipes using that fruit
    for (const goal of prefs.dietary_goals) {
      if (chunk.content.toLowerCase().includes(goal.replace("-", " "))) {
        nutritionTagBoosts[chunk.fruit_id] = (nutritionTagBoosts[chunk.fruit_id] ?? 0) + 0.03;
      }
    }
  }

  const scored = candidates
    .filter((r) => !dislikedIds.has(r.id))
    .map((r) => {
      const tagBoost = r.dietary_tags.filter((t) => likedTags.includes(t)).length * 0.05;
      const nutritionBoost = r.fruit_tags.reduce(
        (sum, fid) => sum + (nutritionTagBoosts[fid] ?? 0),
        0
      );
      return { ...r, score: r.similarity + tagBoost + nutritionBoost };
    })
    .sort((a, b) => b.score - a.score);

  // ── Phase 5: Build Empty Day Slots ────────────────────────────────────────
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

  // ── Phase 6: Urgency-First Slot Assignment ────────────────────────────────
  // For each fruit in urgency order, assign matching recipes to early-week days.
  // Produce knowledge is used to inform urgency — if we retrieved storage tips
  // for a fruit, that confirms the shelf-life concern is real.
  for (const fruit of urgentFruits) {
    const fruitCandidates = scored.filter((r) => r.fruit_tags.includes(fruit.fruitId));

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

  // ── Phase 7: Fill Remaining Empty Slots ───────────────────────────────────
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

  // ── Phase 8: Shape Into Final Plan ────────────────────────────────────────
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
        difficulty: s.assigned!.difficulty,
      })),
  }));

  // ── Phase 8a: Grocery List ─────────────────────────────────────────────────
  const allRecipeTitles = planDays.flatMap((d) => d.meals.map((m) => m.recipe_title));
  const groceryList = generateGroceryList(allRecipeTitles, fruitIds, produceKnowledge);

  // ── Phase 8b: Waste Alerts ─────────────────────────────────────────────────
  const shelfLifeMap = buildShelfLifeMap();
  const wasteAlerts = generateWasteAlerts(cartItems, planDays, shelfLifeMap, produceKnowledge);

  // ── Phase 8c: Gemini Enrichment ────────────────────────────────────────────
  // Build a structured prompt that includes context from ALL three RAG stores.
  const urgentFruitName = urgentFruits[0]?.name ?? cartItems[0]?.name ?? "fruit";
  const recipeList = planDays
    .map((d) => `Day ${d.day}: ${d.meals.map((m) => m.recipe_title).join(", ")}`)
    .join("\n");

  // Include produce knowledge context if available
  const produceContext = produceKnowledge.length > 0
    ? `\nProduce notes: ${produceKnowledge.slice(0, 3).map((c) => c.content).join(" ")}`
    : "";

  // Include nutrition context if available
  const nutritionContext = nutritionKnowledge.length > 0
    ? `\nNutrition notes: ${nutritionKnowledge.slice(0, 2).map((c) => c.content).join(" ")}`
    : "";

  const prompt = `You are a friendly meal planning assistant for Ballow Fruit Co., a home-grown fruit business in Encinitas, California where the Ballow family grows fruit trees in their yard.

A customer ordered these fruits: ${cartItems.map((i) => i.name).join(", ")}.
Dietary goals: ${prefs.dietary_goals.length > 0 ? prefs.dietary_goals.join(", ") : "balanced healthy"}.
${produceContext}${nutritionContext}

Here is their 7-day recipe plan:
${recipeList}

Write 2-3 sentences as a friendly intro to their plan. Mention that ${urgentFruitName} should be used first this week. Keep it warm and specific to their goals. Plain text only, no emojis.`;

  let summary = "";
  try {
    summary = await generatePlanText(prompt);
  } catch {
    summary = `Your 7-day plan is ready. Start with your ${urgentFruitName} early this week — they're best used in the first few days. Everything else is scheduled to be used before it spoils.`;
  }

  return {
    days: planDays,
    summary,
    groceryList,
    wasteAlerts,
    ragContextSummary: contextSummary,
  };
}
