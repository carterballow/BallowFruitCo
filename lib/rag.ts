import { embedText } from "./embeddings";
import { getSupabase } from "./supabase";

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
  category: string;
  content: string;
  similarity: number;
};

export type NutritionChunk = {
  id: string;
  fruit_id: string;
  category: string;
  content: string;
  similarity: number;
};

export type MultiStoreContext = {
  recipes: RecipeMatch[];
  produceKnowledge: ProduceChunk[];
  nutritionKnowledge: NutritionChunk[];
  queryVector: number[];
  contextSummary: string;
};

export function buildContextQuery(
  cartItems: { id: string; name: string; quantity: number }[],
  dietaryGoals: string[],
  skillLevel: string,
  pastLikedTags: string[],
  inventoryAlerts: string[]
): string {
  const fruitNames = cartItems.map((i) => i.name).join(", ");
  const goalText = dietaryGoals.length > 0 ? dietaryGoals.join(", ") : "balanced healthy";

  let query = `${goalText} recipes using ${fruitNames}, ${skillLevel} cooking skill`;

  if (pastLikedTags.length > 0) {
    const uniqueTags = [...new Set(pastLikedTags)].slice(0, 5);
    query += `. Preferred recipe style: ${uniqueTags.join(", ")}`;
  }

  if (inventoryAlerts.length > 0) {
    query += `. Priority: use ${inventoryAlerts.join(" and ")} first as they spoil soon`;
  }

  return query;
}

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
    console.warn("Produce knowledge retrieval failed:", error.message);
    return [];
  }
  return (data as ProduceChunk[]) ?? [];
}

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
    console.warn("Nutrition knowledge retrieval failed:", error.message);
    return [];
  }
  return (data as NutritionChunk[]) ?? [];
}

export async function multiStoreRetrieval(
  queryText: string,
  fruitIds: string[],
  excludeTags: string[],
  topK = 20
): Promise<MultiStoreContext> {
  const [recipes, produceKnowledge, nutritionKnowledge, queryVector] = await Promise.all([
    retrieveRecipes(queryText, fruitIds, excludeTags, topK),
    retrieveProduceKnowledge(queryText, fruitIds, 10),
    retrieveNutritionKnowledge(queryText, fruitIds, 8),
    embedText(queryText),
  ]);

  const storeSummary = [
    `Recipe store: ${recipes.length} candidate recipes retrieved`,
    produceKnowledge.length > 0
      ? `Produce store: ${produceKnowledge.length} knowledge chunks (${[...new Set(produceKnowledge.map((c) => c.category))].join(", ")})`
      : "Produce store: no data yet",
    nutritionKnowledge.length > 0
      ? `Nutrition store: ${nutritionKnowledge.length} knowledge chunks (${[...new Set(nutritionKnowledge.map((c) => c.category))].join(", ")})`
      : "Nutrition store: no data yet",
  ].join(". ");

  return {
    recipes,
    produceKnowledge,
    nutritionKnowledge,
    queryVector,
    contextSummary: storeSummary,
  };
}

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
    for (const pair of pairs.slice(0, 2)) {
      if (!seen.has(pair.item)) {
        seen.add(pair.item);
        suggestions.push({ name: pair.item, reason: pair.reason, urgency: "this week" });
      }
    }
  }

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

  return suggestions.slice(0, 8);
}

export type WasteAlert = {
  fruit_id: string;
  fruit_name: string;
  days_left: number;
  scheduled_days: number[];
  warning: string;
  tip: string;
};

export function generateWasteAlerts(
  cartItems: { id: string; name: string }[],
  planDays: Array<{ day: number; meals: Array<{ fruit_used: string[] }> }>,
  shelfLifeMap: Record<string, number>,
  produceKnowledge: ProduceChunk[]
): WasteAlert[] {
  const alerts: WasteAlert[] = [];

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
    const latestScheduledDay = scheduledDays.length > 0 ? Math.max(...scheduledDays) : 0;
    const needsAlert = scheduledDays.length === 0 || (shelfLife <= 7 && latestScheduledDay > shelfLife);

    if (needsAlert) {
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
