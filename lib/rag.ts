/**
 * lib/rag.ts — Multi-Store Retrieval-Augmented Generation
 *
 * Architecture matches the system diagram:
 *
 *   User layer  →  Query Router + Context Builder
 *                        ↓
 *         ┌──────────────┼──────────────┐
 *    Recipe Index   Produce Knowledge  Nutrition Data
 *    (50k embed.)   (shelf life,        (USDA macros,
 *                    ripeness,           vitamins,
 *                    storage tips)       health benefits)
 *         └──────────────┼──────────────┘
 *                        ↓
 *              Xenova/transformers.js
 *              (local embeddings)
 *                        ↓
 *          ┌─────────────┼──────────────┐
 *       Meal Plan   Grocery List   Waste Alerts
 *
 * The key idea: instead of just searching recipes, we retrieve
 * from THREE separate knowledge bases and merge the context.
 * This makes the planner genuinely smarter — it knows that
 * avocados brown after cutting (produce knowledge), that they
 * have 6.7g of fiber per 100g (nutrition knowledge), AND
 * which recipes use them (recipe index).
 */

import { embedText } from "./embeddings";
import { getSupabase } from "./supabase";

// ── Return types ──────────────────────────────────────────────────────────────

export type RecipeMatch = {
  id: string;
  title: string;
  description: string;
  fruit_tags: string[];
  dietary_tags: string[];
  meal_type: string[];
  difficulty: string;
  similarity: number;
};

export type ProduceChunk = {
  id: string;
  fruit_id: string;
  category: string;  // 'shelf_life' | 'ripeness' | 'storage' | 'flavor' | 'pairing'
  content: string;
  similarity: number;
};

export type NutritionChunk = {
  id: string;
  fruit_id: string;
  category: string;  // 'macros' | 'vitamins' | 'health_benefits' | 'serving_info'
  content: string;
  similarity: number;
};

// The merged context object the planner receives from all 3 stores
export type MultiStoreContext = {
  recipes: RecipeMatch[];
  produceKnowledge: ProduceChunk[];
  nutritionKnowledge: NutritionChunk[];
  queryVector: number[];
  contextSummary: string;  // human-readable summary of what was retrieved
};

// ── Context Builder ───────────────────────────────────────────────────────────
// This is the "Query router + context builder" layer from the diagram.
// It merges signals from all user-layer inputs into a rich query string.

export function buildContextQuery(
  cartItems: { id: string; name: string; quantity: number }[],
  dietaryGoals: string[],
  skillLevel: string,
  pastLikedTags: string[],
  inventoryAlerts: string[]  // fruit names that are low in stock
): string {
  const fruitNames = cartItems.map((i) => i.name).join(", ");
  const goalText = dietaryGoals.length > 0 ? dietaryGoals.join(", ") : "balanced healthy";

  // Build the goal portion
  let query = `${goalText} recipes using ${fruitNames}, ${skillLevel} cooking skill`;

  // Inject liked-recipe style tags (personalization signal)
  if (pastLikedTags.length > 0) {
    const uniqueTags = [...new Set(pastLikedTags)].slice(0, 5);
    query += `. Preferred recipe style: ${uniqueTags.join(", ")}`;
  }

  // Inject urgency signal so the embedding captures time pressure
  if (inventoryAlerts.length > 0) {
    query += `. Priority: use ${inventoryAlerts.join(" and ")} first as they spoil soon`;
  }

  return query;
}

// ── Store 1: Recipe Index ────────────────────────────────────────────────────
// The original retrieval function — searches the recipes table by cosine similarity.

export async function retrieveRecipes(
  queryText: string,
  fruitFilter: string[],
  excludeTags: string[],
  topK = 20
): Promise<RecipeMatch[]> {
  const queryEmbedding = await embedText(queryText);
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("match_recipes", {
    query_embedding: queryEmbedding,
    fruit_filter: fruitFilter,
    exclude_tags: excludeTags.length > 0 ? excludeTags : ["__no_exclusions__"],
    match_count: topK,
  });

  if (error) throw new Error(`Recipe retrieval failed: ${error.message}`);
  return (data as RecipeMatch[]) ?? [];
}

// ── Store 2: Produce Knowledge ────────────────────────────────────────────────
// Retrieves shelf-life, ripeness, storage, and flavor knowledge for the cart fruits.
// This context informs waste alerts and per-day scheduling tips.

export async function retrieveProduceKnowledge(
  queryText: string,
  fruitIds: string[],
  topK = 8
): Promise<ProduceChunk[]> {
  const queryEmbedding = await embedText(queryText);
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("match_produce_knowledge", {
    query_embedding: queryEmbedding,
    fruit_filter: fruitIds,
    match_count: topK,
  });

  if (error) {
    // If the produce_knowledge table doesn't exist yet, return empty gracefully
    console.warn("Produce knowledge retrieval failed (run migrations.sql first):", error.message);
    return [];
  }
  return (data as ProduceChunk[]) ?? [];
}

// ── Store 3: Nutrition Knowledge ──────────────────────────────────────────────
// Retrieves USDA macros, vitamins, and health benefit data for the cart fruits.
// Used to match recipes to the user's dietary goals (e.g. high-fiber → pomegranate recipes).

export async function retrieveNutritionKnowledge(
  queryText: string,
  fruitIds: string[],
  topK = 6
): Promise<NutritionChunk[]> {
  const queryEmbedding = await embedText(queryText);
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("match_nutrition_knowledge", {
    query_embedding: queryEmbedding,
    fruit_filter: fruitIds,
    match_count: topK,
  });

  if (error) {
    console.warn("Nutrition knowledge retrieval failed (run migrations.sql first):", error.message);
    return [];
  }
  return (data as NutritionChunk[]) ?? [];
}

// ── Multi-Store Orchestrator ──────────────────────────────────────────────────
// Queries all three vector stores in parallel (faster than sequential).
// Returns a unified context object the planner uses for all its decisions.

export async function multiStoreRetrieval(
  queryText: string,
  fruitIds: string[],
  excludeTags: string[],
  topK = 20
): Promise<MultiStoreContext> {
  // All three stores searched in parallel — no waiting for one before starting the next
  const [recipes, produceKnowledge, nutritionKnowledge, queryVector] = await Promise.all([
    retrieveRecipes(queryText, fruitIds, excludeTags, topK),
    retrieveProduceKnowledge(queryText, fruitIds, 10),
    retrieveNutritionKnowledge(queryText, fruitIds, 8),
    embedText(queryText),  // reuse the query vector for the summary below
  ]);

  // Build a plain-English summary of what the multi-store retrieval found
  // This gets passed to Gemini as additional context
  const storeSummary = [
    `Recipe store: ${recipes.length} candidate recipes retrieved`,
    produceKnowledge.length > 0
      ? `Produce store: ${produceKnowledge.length} knowledge chunks (${[...new Set(produceKnowledge.map((c) => c.category))].join(", ")})`
      : "Produce store: no data yet (run seed-knowledge.ts)",
    nutritionKnowledge.length > 0
      ? `Nutrition store: ${nutritionKnowledge.length} knowledge chunks (${[...new Set(nutritionKnowledge.map((c) => c.category))].join(", ")})`
      : "Nutrition store: no data yet (run seed-knowledge.ts)",
  ].join(". ");

  return {
    recipes,
    produceKnowledge,
    nutritionKnowledge,
    queryVector,
    contextSummary: storeSummary,
  };
}

// ── Grocery List Generator ────────────────────────────────────────────────────
// Analyzes the meal plan + produce knowledge to recommend pantry items to buy.
// Returns items that appear frequently across recipes but aren't in the cart.

export type GroceryItem = {
  name: string;
  reason: string;
  urgency: "this week" | "optional";
};

export function generateGroceryList(
  planRecipeTitles: string[],
  cartFruitIds: string[],
  produceKnowledge: ProduceChunk[]
): GroceryItem[] {
  // Common pantry items that pair well with each fruit
  const pairingMap: Record<string, { item: string; reason: string }[]> = {
    "avocados": [
      { item: "Lime juice", reason: "prevents browning and adds brightness to avocado dishes" },
      { item: "Sea salt", reason: "essential finishing touch for avocado toast and guacamole" },
      { item: "Red onion", reason: "classic pairing in guacamole and avocado salads" },
    ],
    "blood-oranges": [
      { item: "Honey", reason: "balances the tartness of blood oranges in dressings and desserts" },
      { item: "Fresh mint", reason: "complements blood orange in salads and drinks" },
    ],
    "naval-oranges": [
      { item: "Greek yogurt", reason: "great base for orange breakfast bowls and parfaits" },
      { item: "Granola", reason: "pairs with orange yogurt bowls and morning snacks" },
    ],
    "lemons": [
      { item: "Olive oil", reason: "core of most lemon-based marinades and dressings" },
      { item: "Fresh garlic", reason: "lemon-garlic is one of the most versatile flavor combinations" },
      { item: "Capers", reason: "classic with lemon in pasta, fish, and chicken dishes" },
    ],
    "limes": [
      { item: "Cilantro", reason: "essential for lime-based salsas, tacos, and Asian dishes" },
      { item: "Fish sauce", reason: "deepens lime-forward Thai and Vietnamese recipes" },
    ],
    "pomegranates": [
      { item: "Arugula", reason: "classic salad base that pairs with pomegranate arils" },
      { item: "Feta cheese", reason: "salty-sweet contrast with pomegranate in salads" },
      { item: "Walnuts", reason: "crunchy texture pairing for pomegranate grain bowls" },
    ],
  };

  const suggestions: GroceryItem[] = [];
  const seen = new Set<string>();

  for (const fruitId of cartFruitIds) {
    const pairs = pairingMap[fruitId] ?? [];
    for (const pair of pairs.slice(0, 2)) {  // max 2 per fruit to keep list focused
      if (!seen.has(pair.item)) {
        seen.add(pair.item);
        suggestions.push({
          name: pair.item,
          reason: pair.reason,
          urgency: "this week",
        });
      }
    }
  }

  // Add universal pantry staples if plan has multiple recipes
  if (planRecipeTitles.length >= 5) {
    const staples = [
      { name: "Extra virgin olive oil", reason: "used in the majority of the plan's recipes", urgency: "this week" as const },
      { name: "Kosher salt + black pepper", reason: "essential seasoning across all recipes", urgency: "this week" as const },
    ];
    for (const staple of staples) {
      if (!seen.has(staple.name)) {
        seen.add(staple.name);
        suggestions.push(staple);
      }
    }
  }

  return suggestions.slice(0, 8);  // cap at 8 items
}

// ── Waste Alert Generator ─────────────────────────────────────────────────────
// Cross-references cart fruits against the plan to flag any fruit that
// doesn't appear early enough given its shelf life.

export type WasteAlert = {
  fruit_id: string;
  fruit_name: string;
  days_left: number;
  scheduled_days: number[];  // which days in the plan use this fruit
  warning: string;
  tip: string;  // storage tip from produce knowledge if available
};

export function generateWasteAlerts(
  cartItems: { id: string; name: string }[],
  planDays: Array<{ day: number; meals: Array<{ fruit_used: string[] }> }>,
  shelfLifeMap: Record<string, number>,  // fruitId -> shelfLifeDays
  produceKnowledge: ProduceChunk[]
): WasteAlert[] {
  const alerts: WasteAlert[] = [];

  // Build a map of which days each fruit appears in the plan
  const fruitDayMap: Record<string, number[]> = {};
  for (const day of planDays) {
    for (const meal of day.meals) {
      for (const fruitId of meal.fruit_used) {
        if (!fruitDayMap[fruitId]) fruitDayMap[fruitId] = [];
        fruitDayMap[fruitId].push(day.day);
      }
    }
  }

  for (const item of cartItems) {
    const shelfLife = shelfLifeMap[item.id] ?? 14;
    const scheduledDays = fruitDayMap[item.id] ?? [];

    // Only alert if:
    // - Fruit isn't scheduled at all, OR
    // - Fruit is only scheduled after its shelf life window
    const latestScheduledDay = scheduledDays.length > 0 ? Math.max(...scheduledDays) : 0;
    const needsAlert = scheduledDays.length === 0 || (shelfLife <= 7 && latestScheduledDay > shelfLife);

    if (needsAlert) {
      // Look for a storage tip in the produce knowledge for this fruit
      const storageTip = produceKnowledge.find(
        (c) => c.fruit_id === item.id && c.category === "storage"
      )?.content ?? `Keep ${item.name.toLowerCase()} at room temperature until ripe, then refrigerate.`;

      alerts.push({
        fruit_id: item.id,
        fruit_name: item.name,
        days_left: shelfLife,
        scheduled_days: scheduledDays,
        warning:
          scheduledDays.length === 0
            ? `${item.name} isn't used in any planned meal — consider adding them manually.`
            : `${item.name} are scheduled late (Day ${latestScheduledDay}) but only last ${shelfLife} days.`,
        tip: storageTip,
      });
    }
  }

  return alerts;
}
