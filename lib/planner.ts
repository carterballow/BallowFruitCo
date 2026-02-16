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

export type CartItem = {
  id: string;
  name: string;
  quantity: number;
};

export type UserPrefs = {
  dietary_goals: string[];
  allergies: string[];
  meals_per_day: number;
  skill_level: string;
};

export type PastRating = {
  recipe_id: string;
  rating: number;
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
  summary: string;
  groceryList: GroceryItem[];
  wasteAlerts: WasteAlert[];
  ragContextSummary: string;
};

function addDays(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function getMealTypes(mealsPerDay: number): string[] {
  if (mealsPerDay === 2) return ["breakfast", "dinner"];
  return ["breakfast", "lunch", "dinner"];
}

function buildShelfLifeMap(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(FRUIT_DATA).map(([id, data]) => [id, data.shelfLifeDays])
  );
}

export async function generateWeeklyPlan(
  cartItems: CartItem[],
  prefs: UserPrefs,
  pastRatings: PastRating[],
  weekStart: Date,
  seed = Math.random()
): Promise<WeeklyPlan> {

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

  const dislikedIds = new Set(
    pastRatings.filter((r) => r.rating <= 2).map((r) => r.recipe_id)
  );

  const likedTags = pastRatings
    .filter((r) => r.rating >= 4 && r.dietary_tags?.length)
    .flatMap((r) => r.dietary_tags ?? []);

  const inventoryAlerts = urgentFruits
    .filter((f) => f.urgencyScore >= 8)
    .map((f) => f.name);

  const contextQuery = buildContextQuery(
    cartItems,
    prefs.dietary_goals,
    prefs.skill_level,
    likedTags,
    inventoryAlerts
  );

  const fruitIds = cartItems.map((i) => i.id);

  const { recipes: allCandidates, produceKnowledge, nutritionKnowledge, contextSummary } =
    await multiStoreRetrieval(contextQuery, fruitIds, prefs.allergies, 40);

  const cartFruitSet = new Set(fruitIds);
  const candidates = allCandidates.filter((r) =>
    r.fruit_tags.every((tag) => cartFruitSet.has(tag))
  );

  const nutritionTagBoosts: Record<string, number> = {};
  for (const chunk of nutritionKnowledge) {
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
      const jitter = (Math.abs(Math.sin(seed * 1000 + r.id.charCodeAt(0))) * 0.08);
      return { ...r, score: r.similarity + tagBoost + nutritionBoost + jitter };
    })
    .sort((a, b) => b.score - a.score);

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

  const allRecipeTitles = planDays.flatMap((d) => d.meals.map((m) => m.recipe_title));
  const groceryList = generateGroceryList(allRecipeTitles, fruitIds, produceKnowledge);

  const shelfLifeMap = buildShelfLifeMap();
  const wasteAlerts = generateWasteAlerts(cartItems, planDays, shelfLifeMap, produceKnowledge);

  const urgentFruitName = urgentFruits[0]?.name ?? cartItems[0]?.name ?? "fruit";
  const recipeList = planDays
    .map((d) => `Day ${d.day}: ${d.meals.map((m) => m.recipe_title).join(", ")}`)
    .join("\n");

  const produceContext = produceKnowledge.length > 0
    ? `\nProduce notes: ${produceKnowledge.slice(0, 3).map((c) => c.content).join(" ")}`
    : "";

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
