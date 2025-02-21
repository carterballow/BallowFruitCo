/**
 * One-time recipe seeding script.
 * Run with: npx tsx scripts/embed-recipes.ts
 *
 * What it does:
 *  1. Inserts ~30 recipes into the Supabase `recipes` table
 *  2. For each recipe, calls Gemini to generate a 768-number embedding
 *  3. Stores that embedding so the planner can do smart vector search later
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // kept for text generation
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually since dotenv only reads .env by default
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Embeddings run locally using @xenova/transformers — no API key needed.
// First run downloads the model (~90MB), cached after that.
async function embedText(text: string): Promise<number[]> {
  const { pipeline } = await import("@xenova/transformers");
  const pipe = await pipeline("feature-extraction", "Xenova/bge-base-en-v1.5");
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
}

// ── Recipe database ──────────────────────────────────────────────────────────
// Each recipe has:
//  fruit_tags  — which of the 6 Ballow fruits it uses (drives the planner search filter)
//  dietary_tags — used for personalization and allergy filtering
//  meal_type   — used to assign recipes to the right slot in the day (breakfast vs dinner etc.)

const recipes = [
  // ── Naval Oranges ──────────────────────────────────────────────────────────
  {
    title: "Orange Honey Yogurt Bowl",
    description: "Thick Greek yogurt layered with fresh naval orange segments, a drizzle of honey, and crunchy granola. Fast, filling, and naturally sweet.",
    ingredients: [{ name: "naval oranges", amount: "2", unit: "whole" }, { name: "Greek yogurt", amount: "1", unit: "cup" }, { name: "honey", amount: "1 tbsp", unit: "" }, { name: "granola", amount: "¼ cup", unit: "" }],
    instructions: "Peel and segment the oranges. Spoon yogurt into a bowl. Top with orange segments, drizzle honey over everything, and finish with granola.",
    fruit_tags: ["naval-oranges"],
    dietary_tags: ["vegetarian", "gluten-free", "high-protein"],
    meal_type: ["breakfast", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 1,
  },
  {
    title: "Citrus Overnight Oats",
    description: "Rolled oats soaked overnight in almond milk and brightened with fresh naval orange zest and juice. Ready when you wake up.",
    ingredients: [{ name: "rolled oats", amount: "½ cup", unit: "" }, { name: "almond milk", amount: "¾ cup", unit: "" }, { name: "naval orange", amount: "1", unit: "whole" }, { name: "chia seeds", amount: "1 tsp", unit: "" }, { name: "maple syrup", amount: "1 tsp", unit: "" }],
    instructions: "Combine oats, almond milk, chia seeds, orange zest, orange juice, and maple syrup in a jar. Stir, cover, and refrigerate overnight. Top with fresh orange segments in the morning.",
    fruit_tags: ["naval-oranges"],
    dietary_tags: ["vegan", "high-fiber", "dairy-free"],
    meal_type: ["breakfast"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 1,
  },
  {
    title: "Naval Orange Vinaigrette",
    description: "Fresh-squeezed naval orange juice emulsified with Dijon and sherry vinegar. Bright and citrusy — transforms any salad or grain bowl.",
    ingredients: [{ name: "naval oranges", amount: "2", unit: "whole" }, { name: "Dijon mustard", amount: "1 tsp", unit: "" }, { name: "sherry vinegar", amount: "1 tbsp", unit: "" }, { name: "olive oil", amount: "¼ cup", unit: "" }, { name: "salt and pepper", amount: "to taste", unit: "" }],
    instructions: "Juice the oranges. Whisk together orange juice, Dijon, and sherry vinegar. Slowly drizzle in olive oil while whisking until emulsified. Season with salt and pepper.",
    fruit_tags: ["naval-oranges"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 4,
  },
  {
    title: "Orange Creamsicle Smoothie",
    description: "Frozen naval orange juice blended with vanilla yogurt and a splash of almond milk. Tastes exactly like the ice cream bar, but it's breakfast.",
    ingredients: [{ name: "naval oranges", amount: "3", unit: "whole" }, { name: "vanilla yogurt", amount: "½ cup", unit: "" }, { name: "almond milk", amount: "½ cup", unit: "" }, { name: "honey", amount: "1 tsp", unit: "" }, { name: "ice", amount: "1 cup", unit: "" }],
    instructions: "Juice the oranges. Add all ingredients to a blender and blend until smooth. Taste and adjust sweetness.",
    fruit_tags: ["naval-oranges"],
    dietary_tags: ["vegetarian", "gluten-free"],
    meal_type: ["breakfast", "drink", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 1,
  },
  {
    title: "Orange Glazed Roasted Carrots",
    description: "Roasted carrots finished with a sticky naval orange and honey glaze. The sweetness of the carrots and the citrus of the orange work perfectly together.",
    ingredients: [{ name: "carrots", amount: "1 lb", unit: "" }, { name: "naval orange", amount: "1", unit: "whole" }, { name: "honey", amount: "2 tbsp", unit: "" }, { name: "olive oil", amount: "1 tbsp", unit: "" }, { name: "salt", amount: "to taste", unit: "" }],
    instructions: "Preheat oven to 400°F. Toss carrots with olive oil and salt, roast 20 min. Whisk orange juice with honey, pour over carrots, roast another 10 min until glazed.",
    fruit_tags: ["naval-oranges"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["dinner", "lunch"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 4,
  },

  // ── Blood Oranges ──────────────────────────────────────────────────────────
  {
    title: "Blood Orange Arugula Salad",
    description: "Thinly sliced blood oranges fanned over peppery arugula with shaved fennel and goat cheese. The deep red of the oranges makes this as beautiful as it is good.",
    ingredients: [{ name: "blood oranges", amount: "3", unit: "whole" }, { name: "arugula", amount: "2 cups", unit: "" }, { name: "fennel bulb", amount: "½", unit: "" }, { name: "goat cheese", amount: "2 oz", unit: "" }, { name: "olive oil", amount: "2 tbsp", unit: "" }, { name: "flaky sea salt", amount: "to taste", unit: "" }],
    instructions: "Slice blood oranges into thin rounds. Shave fennel with a mandoline or sharp knife. Fan oranges over arugula, scatter fennel on top, crumble goat cheese, drizzle with olive oil and finish with flaky salt.",
    fruit_tags: ["blood-oranges"],
    dietary_tags: ["vegetarian", "gluten-free", "high-fiber"],
    meal_type: ["lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 2,
  },
  {
    title: "Blood Orange Agua Fresca",
    description: "Fresh blood orange juice thinned with cold water and sweetened lightly. The color is a stunning deep ruby red. Serve over ice with tajín.",
    ingredients: [{ name: "blood oranges", amount: "6", unit: "whole" }, { name: "cold water", amount: "3 cups", unit: "" }, { name: "agave or sugar", amount: "2 tbsp", unit: "" }, { name: "ice", amount: "as needed", unit: "" }, { name: "tajín", amount: "pinch", unit: "" }],
    instructions: "Juice all blood oranges. Combine juice with water and agave, stir to dissolve. Taste and adjust sweetness. Serve over ice with a pinch of tajín on the rim.",
    fruit_tags: ["blood-oranges"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["drink", "snack"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 4,
  },
  {
    title: "Blood Orange Yogurt Parfait",
    description: "Layers of thick Greek yogurt, blood orange segments, and honey. The deep red of the orange against white yogurt looks like something from a restaurant.",
    ingredients: [{ name: "blood oranges", amount: "2", unit: "whole" }, { name: "Greek yogurt", amount: "1 cup", unit: "" }, { name: "honey", amount: "1 tbsp", unit: "" }, { name: "pistachios", amount: "2 tbsp", unit: "chopped" }],
    instructions: "Peel and segment blood oranges. Layer yogurt, orange segments, and repeat. Drizzle honey over the top and finish with chopped pistachios.",
    fruit_tags: ["blood-oranges"],
    dietary_tags: ["vegetarian", "gluten-free", "high-protein"],
    meal_type: ["breakfast", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 1,
  },
  {
    title: "Blood Orange Pan Sauce",
    description: "A restaurant-quality pan sauce made with blood orange juice, shallots, and butter. Finish any seared protein with this and it transforms the whole dish.",
    ingredients: [{ name: "blood oranges", amount: "2", unit: "whole" }, { name: "shallot", amount: "1", unit: "whole" }, { name: "butter", amount: "2 tbsp", unit: "" }, { name: "chicken or vegetable stock", amount: "¼ cup", unit: "" }, { name: "fresh thyme", amount: "2 sprigs", unit: "" }],
    instructions: "After removing protein from the pan, add minced shallot and cook 1 min. Add blood orange juice, stock, and thyme, scraping up brown bits. Simmer until reduced by half. Swirl in cold butter until glossy.",
    fruit_tags: ["blood-oranges"],
    dietary_tags: ["gluten-free"],
    meal_type: ["dinner"],
    difficulty: "intermediate",
    prep_minutes: 10,
    servings: 2,
  },

  // ── Lemons ────────────────────────────────────────────────────────────────
  {
    title: "Classic Lemonade",
    description: "Simple syrup, fresh lemon juice, and cold water. Made with real lemons this is so much better than anything from a bottle.",
    ingredients: [{ name: "lemons", amount: "6", unit: "whole" }, { name: "sugar", amount: "¾ cup", unit: "" }, { name: "cold water", amount: "4 cups", unit: "" }, { name: "ice", amount: "as needed", unit: "" }],
    instructions: "Make simple syrup: combine sugar with ¾ cup hot water, stir until dissolved, cool. Juice lemons. Combine syrup, lemon juice, and remaining cold water. Taste and adjust. Serve over ice.",
    fruit_tags: ["lemons"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["drink"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 4,
  },
  {
    title: "Lemon Pasta with Olive Oil and Parmesan",
    description: "Spaghetti tossed in lemon zest, fresh lemon juice, good olive oil, and a mountain of parmesan. One of those ten-ingredient meals that tastes like a restaurant made it.",
    ingredients: [{ name: "lemons", amount: "2", unit: "whole" }, { name: "spaghetti", amount: "8 oz", unit: "" }, { name: "olive oil", amount: "¼ cup", unit: "" }, { name: "parmesan", amount: "½ cup", unit: "grated" }, { name: "garlic", amount: "2 cloves", unit: "" }, { name: "black pepper", amount: "generous", unit: "" }],
    instructions: "Cook pasta until al dente, reserve ½ cup pasta water. Sauté garlic in olive oil 1 min. Add lemon zest and juice, pasta, and pasta water. Toss vigorously until creamy. Finish with parmesan and lots of black pepper.",
    fruit_tags: ["lemons"],
    dietary_tags: ["vegetarian"],
    meal_type: ["dinner", "lunch"],
    difficulty: "easy",
    prep_minutes: 20,
    servings: 2,
  },
  {
    title: "Lemon Tahini Dressing",
    description: "Lemon juice whisked into tahini with garlic and cold water until silky. Goes on everything — grain bowls, roasted vegetables, falafel, raw salads.",
    ingredients: [{ name: "lemons", amount: "2", unit: "whole" }, { name: "tahini", amount: "¼ cup", unit: "" }, { name: "garlic", amount: "1 clove", unit: "" }, { name: "cold water", amount: "3 tbsp", unit: "" }, { name: "salt", amount: "to taste", unit: "" }],
    instructions: "Juice lemons. Mince garlic finely. Whisk together tahini and lemon juice — it will seize up at first. Add cold water one tablespoon at a time and keep whisking until smooth and pourable. Season with salt.",
    fruit_tags: ["lemons"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["lunch", "dinner", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 4,
  },
  {
    title: "Preserved Lemons",
    description: "Salt-cured lemons in a jar. Takes 4 weeks to cure but then lasts months. A spoonful of the peel elevates braises, pasta, and grain salads with an intense savory-citrus depth.",
    ingredients: [{ name: "lemons", amount: "8", unit: "whole" }, { name: "kosher salt", amount: "½ cup", unit: "" }, { name: "bay leaves", amount: "3", unit: "" }, { name: "black peppercorns", amount: "1 tsp", unit: "" }, { name: "extra lemon juice", amount: "to cover", unit: "" }],
    instructions: "Quarter lemons almost all the way through, keeping the base intact. Pack generously with salt inside each cut. Pack tightly into a sterilized jar with bay leaves and peppercorns. Top with extra lemon juice to cover. Seal and leave at room temperature 4 weeks, turning the jar daily.",
    fruit_tags: ["lemons"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["dinner"],
    difficulty: "intermediate",
    prep_minutes: 15,
    servings: 12,
  },
  {
    title: "Lemon Chia Pudding",
    description: "Chia seeds soaked in almond milk overnight with lemon zest and a little honey. Thick, creamy, and bright. Like a dessert you can have for breakfast.",
    ingredients: [{ name: "lemons", amount: "1", unit: "whole" }, { name: "chia seeds", amount: "3 tbsp", unit: "" }, { name: "almond milk", amount: "1 cup", unit: "" }, { name: "honey", amount: "1 tbsp", unit: "" }, { name: "vanilla extract", amount: "¼ tsp", unit: "" }],
    instructions: "Whisk chia seeds, almond milk, lemon zest, lemon juice, honey, and vanilla together. Refrigerate at least 4 hours or overnight. Stir before serving — it should be thick and pudding-like.",
    fruit_tags: ["lemons"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free", "high-fiber"],
    meal_type: ["breakfast", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 2,
  },

  // ── Limes ─────────────────────────────────────────────────────────────────
  {
    title: "Sparkling Limeade",
    description: "Fresh lime juice, a little agave, and sparkling water. The lime from the farm is more aromatic than store-bought — this drink shows that off.",
    ingredients: [{ name: "limes", amount: "4", unit: "whole" }, { name: "agave syrup", amount: "2 tbsp", unit: "" }, { name: "sparkling water", amount: "2 cups", unit: "" }, { name: "ice", amount: "as needed", unit: "" }, { name: "fresh mint", amount: "optional", unit: "" }],
    instructions: "Juice limes. Stir lime juice with agave until dissolved. Pour over ice, top with sparkling water, stir gently. Garnish with mint if you have it.",
    fruit_tags: ["limes"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["drink", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 2,
  },
  {
    title: "Lime Marinade for Chicken or Fish",
    description: "Fresh lime juice, garlic, cumin, and olive oil. Marinate for 20 minutes minimum. The acid from the lime tenderizes while the cumin adds depth.",
    ingredients: [{ name: "limes", amount: "3", unit: "whole" }, { name: "garlic", amount: "3 cloves", unit: "" }, { name: "cumin", amount: "1 tsp", unit: "" }, { name: "olive oil", amount: "3 tbsp", unit: "" }, { name: "salt", amount: "1 tsp", unit: "" }, { name: "black pepper", amount: "½ tsp", unit: "" }],
    instructions: "Juice limes, mince garlic. Whisk together all ingredients. Pour over protein and marinate at least 20 min in the fridge, up to 2 hours. Grill, bake, or pan-sear as usual.",
    fruit_tags: ["limes"],
    dietary_tags: ["gluten-free", "dairy-free"],
    meal_type: ["dinner", "lunch"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 2,
  },
  {
    title: "Cucumber Lime Salad",
    description: "Sliced cucumber with fresh lime juice, a little chili, and cilantro. Clean and refreshing. Works as a side or a light lunch with some protein added.",
    ingredients: [{ name: "limes", amount: "2", unit: "whole" }, { name: "English cucumber", amount: "1", unit: "large" }, { name: "fresh cilantro", amount: "¼ cup", unit: "" }, { name: "red onion", amount: "¼", unit: "sliced thin" }, { name: "chili flakes", amount: "pinch", unit: "" }, { name: "salt", amount: "to taste", unit: "" }],
    instructions: "Slice cucumber thin. Toss with lime juice, cilantro, red onion, and chili flakes. Season with salt. Let sit 5 min before serving so the cucumber releases some water.",
    fruit_tags: ["limes"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free", "low-calorie"],
    meal_type: ["lunch", "dinner", "snack"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 2,
  },
  {
    title: "Lime Black Bean Tacos",
    description: "Canned black beans brightened with fresh lime juice, cumin, and garlic. Serve in warm corn tortillas with whatever toppings you have around.",
    ingredients: [{ name: "limes", amount: "2", unit: "whole" }, { name: "black beans", amount: "1 can", unit: "" }, { name: "garlic", amount: "2 cloves", unit: "" }, { name: "cumin", amount: "1 tsp", unit: "" }, { name: "corn tortillas", amount: "6", unit: "" }, { name: "salt", amount: "to taste", unit: "" }],
    instructions: "Drain and rinse beans. Cook garlic in oil 1 min, add beans and cumin, cook 3 min. Squeeze lime juice over beans, mash slightly. Warm tortillas. Serve beans in tortillas with any toppings: salsa, sour cream, cilantro.",
    fruit_tags: ["limes"],
    dietary_tags: ["vegan", "dairy-free", "high-fiber", "high-protein"],
    meal_type: ["lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 15,
    servings: 2,
  },

  // ── Pomegranates ───────────────────────────────────────────────────────────
  {
    title: "Pomegranate Walnut Salad",
    description: "Mixed greens with pomegranate arils, toasted walnuts, and crumbled feta, dressed with a honey-balsamic vinaigrette. The arils pop against the bitter greens.",
    ingredients: [{ name: "pomegranates", amount: "1", unit: "whole" }, { name: "mixed greens", amount: "4 cups", unit: "" }, { name: "walnuts", amount: "¼ cup", unit: "toasted" }, { name: "feta cheese", amount: "2 oz", unit: "" }, { name: "balsamic vinegar", amount: "1 tbsp", unit: "" }, { name: "honey", amount: "1 tsp", unit: "" }, { name: "olive oil", amount: "2 tbsp", unit: "" }],
    instructions: "Seed the pomegranate (do it in a bowl of water to avoid mess). Whisk balsamic, honey, and olive oil for dressing. Toss greens with dressing. Top with pomegranate arils, walnuts, and crumbled feta.",
    fruit_tags: ["pomegranates"],
    dietary_tags: ["vegetarian", "gluten-free", "high-fiber"],
    meal_type: ["lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 15,
    servings: 2,
  },
  {
    title: "Pomegranate Molasses",
    description: "Pomegranate juice reduced with sugar and lemon until thick and syrupy. One of the most versatile pantry ingredients you can make. Use on roasted meats, drizzled on yogurt, or stirred into cocktails.",
    ingredients: [{ name: "pomegranates", amount: "3", unit: "whole" }, { name: "sugar", amount: "¼ cup", unit: "" }, { name: "lemon", amount: "1", unit: "whole" }],
    instructions: "Juice pomegranates — score and squeeze, or use a citrus juicer. You need about 2 cups juice. Combine juice, sugar, and lemon juice in a small saucepan. Simmer over medium-low heat 45-60 min until reduced to about ½ cup and thick enough to coat a spoon. Cool — it thickens more as it cools.",
    fruit_tags: ["pomegranates"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["dinner", "snack"],
    difficulty: "intermediate",
    prep_minutes: 60,
    servings: 8,
  },
  {
    title: "Pomegranate Overnight Oats",
    description: "Oats soaked overnight with pomegranate juice and topped with fresh arils in the morning. The juice turns the oats a beautiful deep pink.",
    ingredients: [{ name: "pomegranates", amount: "1", unit: "whole" }, { name: "rolled oats", amount: "½ cup", unit: "" }, { name: "almond milk", amount: "½ cup", unit: "" }, { name: "pomegranate juice", amount: "¼ cup", unit: "" }, { name: "honey", amount: "1 tbsp", unit: "" }, { name: "chia seeds", amount: "1 tsp", unit: "" }],
    instructions: "Seed the pomegranate and set aside arils. Mix oats, almond milk, pomegranate juice, honey, and chia seeds in a jar. Refrigerate overnight. Top with fresh arils before serving.",
    fruit_tags: ["pomegranates"],
    dietary_tags: ["vegan", "dairy-free", "high-fiber"],
    meal_type: ["breakfast"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 1,
  },
  {
    title: "Pomegranate Quinoa Bowl",
    description: "Cooked quinoa topped with pomegranate arils, cucumber, fresh mint, and a lemon-olive oil dressing. High protein, high fiber, and the arils add a sweet pop to every bite.",
    ingredients: [{ name: "pomegranates", amount: "1", unit: "whole" }, { name: "quinoa", amount: "1 cup", unit: "cooked" }, { name: "cucumber", amount: "½", unit: "diced" }, { name: "fresh mint", amount: "¼ cup", unit: "" }, { name: "olive oil", amount: "2 tbsp", unit: "" }, { name: "lemon", amount: "1", unit: "juiced" }, { name: "salt", amount: "to taste", unit: "" }],
    instructions: "Cook quinoa per package instructions and cool to room temp. Seed pomegranate. Combine quinoa, pomegranate arils, cucumber, and mint. Dress with olive oil and lemon juice, season with salt.",
    fruit_tags: ["pomegranates"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free", "high-protein", "high-fiber"],
    meal_type: ["lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 20,
    servings: 2,
  },

  // ── Avocados ───────────────────────────────────────────────────────────────
  {
    title: "Avocado Toast with Lemon and Flaky Salt",
    description: "Ripe Hass avocado smashed on thick sourdough toast, finished with fresh lemon juice and flaky salt. The lemon cuts through the richness and lifts the whole thing.",
    ingredients: [{ name: "avocados", amount: "1", unit: "ripe" }, { name: "sourdough bread", amount: "2 slices", unit: "" }, { name: "lemons", amount: "½", unit: "" }, { name: "flaky sea salt", amount: "pinch", unit: "" }, { name: "red pepper flakes", amount: "optional", unit: "" }],
    instructions: "Toast bread until golden and crisp. Halve and pit the avocado, scoop flesh into a bowl, and smash with a fork — leave it chunky. Spread on toast, squeeze lemon over the top, finish with flaky salt and pepper flakes.",
    fruit_tags: ["avocados", "lemons"],
    dietary_tags: ["vegan", "dairy-free", "high-fiber"],
    meal_type: ["breakfast", "lunch", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 1,
  },
  {
    title: "Classic Guacamole",
    description: "Perfectly ripe Hass avocados mashed with lime juice, cilantro, red onion, and jalapeño. Nothing more. Nothing fancy needed when the avocados are this good.",
    ingredients: [{ name: "avocados", amount: "3", unit: "ripe" }, { name: "limes", amount: "2", unit: "whole" }, { name: "red onion", amount: "¼", unit: "finely diced" }, { name: "jalapeño", amount: "1", unit: "seeded and minced" }, { name: "fresh cilantro", amount: "¼ cup", unit: "chopped" }, { name: "kosher salt", amount: "½ tsp", unit: "" }],
    instructions: "Halve and pit avocados. Scoop flesh into a bowl. Squeeze in lime juice, add salt, and mash to your desired texture. Fold in red onion, jalapeño, and cilantro. Taste and adjust lime and salt.",
    fruit_tags: ["avocados", "limes"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["snack", "lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 4,
  },
  {
    title: "Avocado Citrus Salad",
    description: "Sliced avocado and blood orange or naval orange over arugula with a citrus vinaigrette. The creaminess of the avocado against the bright citrus is one of the best flavor combinations.",
    ingredients: [{ name: "avocados", amount: "2", unit: "ripe" }, { name: "blood-oranges", amount: "2", unit: "whole" }, { name: "arugula", amount: "2 cups", unit: "" }, { name: "olive oil", amount: "2 tbsp", unit: "" }, { name: "lemon", amount: "½", unit: "" }, { name: "flaky salt", amount: "to taste", unit: "" }],
    instructions: "Slice avocados and orange into rounds. Fan over arugula. Drizzle with olive oil, squeeze lemon, and finish with flaky salt.",
    fruit_tags: ["avocados", "blood-oranges"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free", "high-fiber"],
    meal_type: ["lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 2,
  },
  {
    title: "Avocado Green Smoothie",
    description: "Half an avocado blended with almond milk, spinach, lime juice, and honey. The avocado makes it thick and creamy without any banana. A genuinely filling breakfast.",
    ingredients: [{ name: "avocados", amount: "½", unit: "ripe" }, { name: "limes", amount: "1", unit: "whole" }, { name: "baby spinach", amount: "1 cup", unit: "" }, { name: "almond milk", amount: "1 cup", unit: "" }, { name: "honey", amount: "1 tbsp", unit: "" }, { name: "ice", amount: "½ cup", unit: "" }],
    instructions: "Juice the lime. Add all ingredients to a blender and blend until completely smooth. Taste — adjust honey or lime to your preference.",
    fruit_tags: ["avocados", "limes"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["breakfast", "drink", "snack"],
    difficulty: "easy",
    prep_minutes: 5,
    servings: 1,
  },
  {
    title: "Avocado Egg Scramble",
    description: "Soft scrambled eggs topped with sliced avocado, a squeeze of lime, and everything bagel seasoning. Protein-packed and done in under 10 minutes.",
    ingredients: [{ name: "avocados", amount: "1", unit: "ripe" }, { name: "limes", amount: "½", unit: "" }, { name: "eggs", amount: "3", unit: "" }, { name: "butter", amount: "1 tsp", unit: "" }, { name: "everything bagel seasoning", amount: "1 tsp", unit: "" }, { name: "salt", amount: "to taste", unit: "" }],
    instructions: "Whisk eggs with a pinch of salt. Melt butter over low heat, add eggs, and stir constantly until just barely set — they should still look slightly wet. Plate, top with sliced avocado, squeeze lime juice, and sprinkle everything bagel seasoning.",
    fruit_tags: ["avocados", "limes"],
    dietary_tags: ["vegetarian", "gluten-free", "high-protein"],
    meal_type: ["breakfast"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 1,
  },

  // ── Multi-fruit ────────────────────────────────────────────────────────────
  {
    title: "Citrus Fruit Salad",
    description: "Naval oranges, blood oranges, and pomegranate arils tossed with a little honey and fresh mint. No dressing needed — the fruit juices do it themselves.",
    ingredients: [{ name: "naval-oranges", amount: "2", unit: "whole" }, { name: "blood-oranges", amount: "2", unit: "whole" }, { name: "pomegranates", amount: "½", unit: "whole" }, { name: "honey", amount: "1 tbsp", unit: "" }, { name: "fresh mint", amount: "¼ cup", unit: "" }],
    instructions: "Peel and segment all citrus, removing as much pith as possible. Seed the pomegranate half. Combine fruit in a bowl, drizzle honey, tear mint leaves over the top. Toss gently.",
    fruit_tags: ["naval-oranges", "blood-oranges", "pomegranates"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free", "high-fiber"],
    meal_type: ["breakfast", "snack"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 3,
  },
  {
    title: "Avocado Orange Salsa",
    description: "Diced avocado and naval orange with red onion, cilantro, and lime. Goes on grilled fish or chicken, or eaten straight with tortilla chips.",
    ingredients: [{ name: "avocados", amount: "1", unit: "ripe" }, { name: "naval-oranges", amount: "1", unit: "whole" }, { name: "limes", amount: "1", unit: "whole" }, { name: "red onion", amount: "¼", unit: "finely diced" }, { name: "fresh cilantro", amount: "3 tbsp", unit: "" }, { name: "jalapeño", amount: "½", unit: "optional" }, { name: "salt", amount: "to taste", unit: "" }],
    instructions: "Dice avocado and orange into similar-sized pieces. Combine with red onion, cilantro, and jalapeño if using. Squeeze lime juice over the top, season with salt. Serve immediately.",
    fruit_tags: ["avocados", "naval-oranges", "limes"],
    dietary_tags: ["vegan", "gluten-free", "dairy-free"],
    meal_type: ["snack", "lunch", "dinner"],
    difficulty: "easy",
    prep_minutes: 10,
    servings: 2,
  },
];

// ── Embedding text builder ────────────────────────────────────────────────────
// This is the text that gets converted into a 768-number vector.
// It captures all the key info about the recipe so the vector search
// can find it based on meaning, not just keyword matching.
function buildEmbedText(recipe: typeof recipes[0]): string {
  return [
    recipe.title,
    recipe.description,
    `Uses: ${recipe.fruit_tags.join(", ")}.`,
    `Tags: ${recipe.dietary_tags.join(", ")}.`,
    `Meal type: ${recipe.meal_type.join(", ")}.`,
    `Difficulty: ${recipe.difficulty}.`,
    recipe.prep_minutes ? `${recipe.prep_minutes} minutes.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nSeeding ${recipes.length} recipes into Supabase...\n`);

  // Check required env vars before starting
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("Missing required env vars. Make sure .env.local has SUPABASE_URL and SUPABASE_ANON_KEY.");
    process.exit(1);
  }

  // Wipe any partial rows from previous failed runs before re-seeding
  console.log("Clearing existing recipes...");
  await supabase.from("recipes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared.\n");

  let successCount = 0;
  let errorCount = 0;

  for (const recipe of recipes) {
    process.stdout.write(`  ${recipe.title}... `);

    try {
      // Step 1: Insert recipe into Supabase (without embedding yet)
      const { data, error: insertError } = await supabase
        .from("recipes")
        .insert({
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          fruit_tags: recipe.fruit_tags,
          dietary_tags: recipe.dietary_tags,
          meal_type: recipe.meal_type,
          difficulty: recipe.difficulty,
          prep_minutes: recipe.prep_minutes,
          servings: recipe.servings,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Step 2: Generate embedding from Gemini
      const text = buildEmbedText(recipe);
      const embedding = await embedText(text);

      // Step 3: Update the row with the embedding vector
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ embedding })
        .eq("id", data.id);

      if (updateError) throw updateError;

      console.log("done");
      successCount++;

      // Small delay to respect Gemini free tier rate limit (15 req/min)
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log("FAILED");
      console.error(`    Error: ${err instanceof Error ? err.message : err}`);
      errorCount++;
    }
  }

  console.log(`\nDone. ${successCount} succeeded, ${errorCount} failed.\n`);
}

main();
