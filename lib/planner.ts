import { FRUIT_DATA } from "./nutrition";
import {
  multiStoreRetrieval,
  buildContextQuery,
  generateGroceryList,
  generateWasteAlerts,
  GroceryItem,
  WasteAlert,
  RecipeMatch,
  ProduceChunk,
  NutritionChunk,
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
  return mealsPerDay === 2 ? ["breakfast", "dinner"] : ["breakfast", "lunch", "dinner"];
}

function buildShelfLifeMap(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(FRUIT_DATA).map(([id, data]) => [id, data.shelfLifeDays])
  );
}

function applyHardFilters(candidates: RecipeMatch[], prefs: UserPrefs): RecipeMatch[] {
  let filtered = [...candidates];

  if (prefs.skill_level === "beginner") {
    const easy = filtered.filter((r) => r.difficulty === "easy");
    if (easy.length >= 7) filtered = easy;
  } else if (prefs.skill_level === "intermediate") {
    const easyMid = filtered.filter((r) => ["easy", "intermediate"].includes(r.difficulty));
    if (easyMid.length >= 7) filtered = easyMid;
  }

  for (const allergy of prefs.allergies) {
    if (allergy === "dairy") {
      const dairyFree = filtered.filter((r) => r.dietary_tags.includes("dairy-free"));
      if (dairyFree.length >= 7) filtered = dairyFree;
    }
    if (allergy === "gluten") {
      const glutenFree = filtered.filter((r) => r.dietary_tags.includes("gluten-free"));
      if (glutenFree.length >= 7) filtered = glutenFree;
    }
    if (allergy === "nuts") {
      const nutFree = filtered.filter((r) => {
        const text = (r.title + " " + r.description).toLowerCase();
        return !text.includes("walnut") && !text.includes("peanut") &&
               !text.includes("almond") && !text.includes("pecan") && !text.includes("cashew");
      });
      if (nutFree.length >= 7) filtered = nutFree;
    }
    if (allergy === "eggs") {
      const eggFree = filtered.filter((r) => {
        const text = (r.title + " " + r.description).toLowerCase();
        return !text.includes(" egg") && !text.includes("eggs");
      });
      if (eggFree.length >= 7) filtered = eggFree;
    }
    if (allergy === "soy") {
      const soyFree = filtered.filter((r) => {
        const text = (r.title + " " + r.description).toLowerCase();
        return !text.includes("soy") && !text.includes("tofu") && !text.includes("edamame");
      });
      if (soyFree.length >= 7) filtered = soyFree;
    }
    if (allergy === "dairy") {
      const dairyFree = filtered.filter((r) => {
        const text = (r.title + " " + r.description).toLowerCase();
        return !text.includes("ricotta") && !text.includes("yogurt") &&
               !text.includes("cheese") && !text.includes("butter") &&
               !text.includes("cream") && !text.includes("milk") &&
               !text.includes("parmesan");
      });
      if (dairyFree.length >= 7) filtered = dairyFree;
    }
  }

  if (prefs.dietary_goals.includes("vegan")) {
    const vegan = filtered.filter((r) => r.dietary_tags.includes("vegan"));
    if (vegan.length >= 7) filtered = vegan;
  } else if (prefs.dietary_goals.includes("vegetarian")) {
    const veg = filtered.filter((r) =>
      r.dietary_tags.includes("vegetarian") || r.dietary_tags.includes("vegan")
    );
    if (veg.length >= 7) filtered = veg;
  }

  return filtered;
}

async function buildGeminiPlan(
  candidates: RecipeMatch[],
  cartItems: CartItem[],
  prefs: UserPrefs,
  pastRatings: PastRating[],
  produceKnowledge: ProduceChunk[],
  nutritionKnowledge: NutritionChunk[],
  urgentFruits: { fruitId: string; name: string; urgencyScore: number; latestDay: number }[],
  weekStart: Date
): Promise<{ days: DayPlan[]; summary: string }> {
  const mealTypes = getMealTypes(prefs.meals_per_day);
  const days = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    date: addDays(weekStart, i),
  }));

  const dislikedIds = new Set(pastRatings.filter((r) => r.rating <= 2).map((r) => r.recipe_id));
  const likedTitles = pastRatings
    .filter((r) => r.rating >= 4)
    .map((r) => {
      const match = candidates.find((c) => c.id === r.recipe_id);
      return match ? match.title : null;
    })
    .filter(Boolean);

  const available = candidates.filter((r) => !dislikedIds.has(r.id));

  const recipeList = available
    .map((r) =>
      `ID:${r.id} | "${r.title}" | meals:${r.meal_type.join("/")} | difficulty:${r.difficulty} | tags:${r.dietary_tags.join(",")} | fruit:${r.fruit_tags.join(",")}`
    )
    .join("\n");

  const urgencyText = urgentFruits
    .map((f) => `- ${f.name}: use by Day ${f.latestDay} (urgency ${f.urgencyScore}/10)`)
    .join("\n");

  const produceText = produceKnowledge
    .slice(0, 8)
    .map((c) => `${c.fruit_id} [${c.category}]: ${c.content}`)
    .join("\n");

  const nutritionText = nutritionKnowledge
    .slice(0, 6)
    .map((c) => `${c.fruit_id}: ${c.content}`)
    .join("\n");

  const likedText = likedTitles.length > 0
    ? `Previously enjoyed: ${likedTitles.join(", ")}. Favor similar recipes.`
    : "";

  const goalInstructions: Record<string, string> = {
    "high-protein": "Prioritize recipes with high-protein tag. Aim for at least one high-protein meal per day.",
    "high-fiber": "Prioritize recipes with high-fiber tag. Include fiber-rich options daily.",
    "low-sugar": "Avoid recipes with heavy sugar. Prefer savory and naturally sweetened options.",
    "low-carb": "Avoid pasta, bread, and grain-heavy recipes. Prioritize proteins and vegetables.",
    "vegan": "Only use recipes tagged vegan.",
    "vegetarian": "Only use recipes tagged vegetarian or vegan.",
  };

  const goalRules = prefs.dietary_goals
    .map((g) => goalInstructions[g] ?? `Favor recipes matching the goal: ${g}.`)
    .join("\n");

  const skillInstructions: Record<string, string> = {
    beginner: "This person is a beginner cook. Strongly prefer 'easy' difficulty recipes. Avoid intermediate or advanced.",
    intermediate: "This person has intermediate cooking skill. A good mix of easy and intermediate difficulty is ideal.",
    advanced: "This person is an advanced cook. Include intermediate and complex recipes to keep things interesting.",
  };

  const prompt = `You are an expert meal planning AI for Ballow Fruit Co., a family farm in Encinitas, CA. Your job is to create a genuinely personalized, intelligent 7-day meal plan.

== CUSTOMER CART ==
${cartItems.map((i) => `${i.name} (qty: ${i.quantity})`).join("\n")}

== FRUIT URGENCY (freshness constraints) ==
${urgencyText || "No urgent items."}

== CUSTOMER PREFERENCES ==
Dietary goals: ${prefs.dietary_goals.length ? prefs.dietary_goals.join(", ") : "none"}
Allergies: ${prefs.allergies.length ? prefs.allergies.join(", ") : "none"}
Meals per day: ${prefs.meals_per_day} (${mealTypes.join(", ")})
Cooking skill: ${prefs.skill_level}
${likedText}

== PRODUCE KNOWLEDGE ==
${produceText || "No produce data."}

== NUTRITION CONTEXT ==
${nutritionText || "No nutrition data."}

== AVAILABLE RECIPES ==
${recipeList}

== PLANNING RULES ==
1. NEVER repeat the same recipe_id in the plan.
2. Urgency: assign fruits with urgency 8+ to Days 1-${urgentFruits.find((f) => f.urgencyScore >= 8)?.latestDay ?? 3} only.
3. Meal types: each meal slot must use a recipe that supports that meal type (check the meals: field).
4. Variety: do NOT put the same fruit or same flavor profile in consecutive meals. Spread fruit usage across the whole week.
5. Dietary goals:
${goalRules || "Balance variety across all dietary styles."}
6. Skill level: ${skillInstructions[prefs.skill_level] ?? "Match skill level appropriately."}
7. If dietary goals include 'high-protein', ensure at least 1 high-protein meal per day.
8. Snacks and drinks can fill slots if no lunch/dinner recipe fits — only use if meal_type list includes 'snack' or 'drink' for that slot type.
9. Always fill all ${prefs.meals_per_day * 7} meal slots.

== WEEK DATES ==
${days.map((d) => `Day ${d.day}: ${d.date}`).join("\n")}

Return ONLY valid JSON. No markdown, no explanation, no code blocks. Just raw JSON:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "meals": [
        {"meal_type": "breakfast", "recipe_id": "UUID-here", "recipe_title": "Title here"},
        {"meal_type": "lunch", "recipe_id": "UUID-here", "recipe_title": "Title here"},
        {"meal_type": "dinner", "recipe_id": "UUID-here", "recipe_title": "Title here"}
      ]
    }
  ],
  "summary": "2-3 sentences: warm intro mentioning their specific goals, which fruit to use first and why, and what makes this plan work for them personally."
}`;

  const raw = await generatePlanText(prompt);
  const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  const parsed = JSON.parse(jsonStr);

  const recipeMap = new Map(available.map((r) => [r.id, r]));

  const planDays: DayPlan[] = (parsed.days as Array<{
    day: number;
    date: string;
    meals: Array<{ meal_type: string; recipe_id: string; recipe_title: string }>;
  }>).map((d) => ({
    day: d.day,
    date: d.date,
    meals: d.meals.map((m) => {
      const recipe = recipeMap.get(m.recipe_id);
      return {
        meal_type: m.meal_type,
        recipe_id: m.recipe_id,
        recipe_title: m.recipe_title,
        fruit_used: recipe?.fruit_tags ?? [],
        difficulty: recipe?.difficulty ?? "easy",
      };
    }),
  }));

  return { days: planDays, summary: parsed.summary ?? "" };
}

function fallbackPlan(
  candidates: RecipeMatch[],
  prefs: UserPrefs,
  urgentFruits: { fruitId: string; name: string; urgencyScore: number; latestDay: number }[],
  weekStart: Date,
  seed: number
): DayPlan[] {
  const fruitIds = urgentFruits.map((f) => f.fruitId);
  const mealTypes = getMealTypes(prefs.meals_per_day);

  const scored = candidates.map((r) => {
    const tagBoost = r.dietary_tags.filter((t) => prefs.dietary_goals.includes(t)).length * 0.1;
    const jitter = Math.abs(Math.sin(seed * 1000 + r.id.charCodeAt(0))) * 0.08;
    return { ...r, score: r.similarity + tagBoost + jitter };
  }).sort((a, b) => b.score - a.score);

  const days = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    date: addDays(weekStart, i),
    meals: mealTypes.map((mt) => ({ meal_type: mt, assigned: null as (typeof scored[0]) | null })),
  }));

  const usedIds = new Set<string>();

  for (const fruit of urgentFruits) {
    const fruitCandidates = scored.filter((r) => r.fruit_tags.includes(fruit.fruitId));
    for (const day of days.slice(0, fruit.latestDay)) {
      for (const slot of day.meals) {
        if (slot.assigned) continue;
        const match = fruitCandidates.find(
          (r) => !usedIds.has(r.id) && r.meal_type.includes(slot.meal_type)
        );
        if (match) { slot.assigned = match; usedIds.add(match.id); }
      }
    }
  }

  for (const day of days) {
    for (const slot of day.meals) {
      if (slot.assigned) continue;
      const fallback = scored.find(
        (r) => !usedIds.has(r.id) && (r.meal_type.includes(slot.meal_type) || r.meal_type.length > 0)
      );
      if (fallback) { slot.assigned = fallback; usedIds.add(fallback.id); }
    }
  }

  return days.map((day) => ({
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

  const likedTags = pastRatings
    .filter((r) => r.rating >= 4 && r.dietary_tags?.length)
    .flatMap((r) => r.dietary_tags ?? []);

  const inventoryAlerts = urgentFruits.filter((f) => f.urgencyScore >= 8).map((f) => f.name);
  const fruitIds = cartItems.map((i) => i.id);

  const contextQuery = buildContextQuery(
    cartItems,
    prefs.dietary_goals,
    prefs.skill_level,
    likedTags,
    inventoryAlerts
  );

  const { recipes: allCandidates, produceKnowledge, nutritionKnowledge, contextSummary } =
    await multiStoreRetrieval(contextQuery, fruitIds, [], 50);

  const cartFruitSet = new Set(fruitIds);
  const cartFiltered = allCandidates.filter((r) =>
    r.fruit_tags.every((tag) => cartFruitSet.has(tag))
  );

  const candidates = applyHardFilters(cartFiltered, prefs);

  let planDays: DayPlan[];
  let summary = "";

  try {
    const result = await buildGeminiPlan(
      candidates,
      cartItems,
      prefs,
      pastRatings,
      produceKnowledge,
      nutritionKnowledge,
      urgentFruits,
      weekStart
    );
    planDays = result.days;
    summary = result.summary;
  } catch (err) {
    console.error("Gemini planning failed, using fallback:", err);
    planDays = fallbackPlan(candidates, prefs, urgentFruits, weekStart, seed);

    const urgentName = urgentFruits[0]?.name ?? cartItems[0]?.name ?? "your fruit";
    const goalText = prefs.dietary_goals.length ? prefs.dietary_goals.join(" and ") : "balanced";
    summary = `Your 7-day ${goalText} plan is ready. Start with your ${urgentName} early this week — use them in the first few days while they're at peak freshness. The rest of the week is scheduled to minimize waste.`;
  }

  const allRecipeTitles = planDays.flatMap((d) => d.meals.map((m) => m.recipe_title));
  const groceryList = generateGroceryList(allRecipeTitles, fruitIds, produceKnowledge);
  const shelfLifeMap = buildShelfLifeMap();
  const wasteAlerts = generateWasteAlerts(cartItems, planDays, shelfLifeMap, produceKnowledge);

  return {
    days: planDays,
    summary,
    groceryList,
    wasteAlerts,
    ragContextSummary: contextSummary,
  };
}
