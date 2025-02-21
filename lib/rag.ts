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

// Searches the recipes table using vector similarity.
// queryText: natural language description of what we want
// fruitFilter: only return recipes that use at least one of these fruits
// excludeTags: filter out recipes with these dietary tags (allergens)
// topK: how many recipes to return
export async function retrieveRecipes(
  queryText: string,
  fruitFilter: string[],
  excludeTags: string[],
  topK = 15
): Promise<RecipeMatch[]> {
  // Step 1: Embed the query text into a 768-number vector
  const queryEmbedding = await embedText(queryText);

  // Step 2: Call the match_recipes SQL function we created in Supabase.
  // It uses the <=> pgvector operator to find recipes whose embeddings
  // are closest in meaning to our query embedding.
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("match_recipes", {
    query_embedding: queryEmbedding,
    fruit_filter: fruitFilter,
    // If no allergens, pass a dummy tag that no recipe has — empty array causes SQL issues
    exclude_tags: excludeTags.length > 0 ? excludeTags : ["__no_exclusions__"],
    match_count: topK,
  });

  if (error) throw new Error(`RAG search failed: ${error.message}`);
  return (data as RecipeMatch[]) ?? [];
}
