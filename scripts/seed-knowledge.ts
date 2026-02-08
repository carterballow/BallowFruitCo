/**
 * Seed script for RAG vector stores #2 and #3.
 * Run with: npx tsx scripts/seed-knowledge.ts
 *
 * Inserts produce knowledge and nutrition knowledge for all 6 fruits,
 * embeds each chunk using the local Xenova transformer model,
 * and stores the 768-dimensional vectors in Supabase.
 *
 * Run migrations.sql in Supabase SQL Editor BEFORE running this script.
 * Run embed-recipes.ts BEFORE this script (it downloads the model).
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually
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

async function embedText(text: string): Promise<number[]> {
  const { pipeline } = await import("@xenova/transformers");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipe = await (pipeline as any)("feature-extraction", "Xenova/bge-base-en-v1.5");
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
}

// ── Produce Knowledge ──────────────────────────────────────────────────────────
// Shelf life, ripeness indicators, storage tips, flavor profiles, and pairings.
// Each chunk is a self-contained fact that can be retrieved by the planner.

const produceKnowledge = [
  // AVOCADOS
  { fruit_id: "avocados", category: "shelf_life", content: "Avocados have a very short shelf life once ripe — typically 3 to 5 days when refrigerated. Unripe avocados ripen at room temperature in 2-5 days depending on firmness. Once cut, the flesh oxidizes quickly. This makes avocados the highest-urgency fruit in any order — always plan avocado recipes for the first 3 days of the week." },
  { fruit_id: "avocados", category: "ripeness", content: "A ripe avocado yields to gentle pressure but is not mushy. The skin turns dark (almost black) when fully ripe. Remove the stem nub — if it comes off easily and is green underneath, the avocado is perfect. If it's brown underneath, it may be overripe inside." },
  { fruit_id: "avocados", category: "storage", content: "Keep unripe avocados at room temperature away from direct sunlight. To speed ripening, place in a paper bag with a banana or apple — they release ethylene gas. Once ripe, refrigerate to slow the process. Rub cut surfaces with lime or lemon juice to prevent browning for up to 24 hours." },
  { fruit_id: "avocados", category: "flavor", content: "Hass avocados have a rich, buttery, nutty flavor with a creamy texture. The fat content (about 15g per half) is predominantly heart-healthy monounsaturated fat. They pair exceptionally well with citrus (especially lime and lemon), salt, tomato, onion, cilantro, and eggs. The flavor intensifies when the avocado is fully ripe." },
  { fruit_id: "avocados", category: "pairing", content: "Avocados pair well with: lime juice (prevents browning, adds brightness), blood oranges (sweet-tart contrast), red onion, garlic, cilantro, eggs, feta cheese, arugula, smoked salmon, and chili flakes. In cooking, avocados are best used raw or at room temperature — heat turns them bitter." },
  { fruit_id: "avocados", category: "cooking", content: "Avocados are best served raw. Use in guacamole, avocado toast, salads, smoothies, and as a topping for tacos and grain bowls. When making guacamole, add lime juice first to prevent browning. Pit-in-bowl storage (leaving the pit in the guacamole) reduces browning surface area." },

  // BLOOD ORANGES
  { fruit_id: "blood-oranges", category: "shelf_life", content: "Blood oranges last 1-2 weeks at room temperature and 3-4 weeks when refrigerated. Unlike avocados, they are stable and low-urgency in the weekly plan. Their peak flavor is from December through March. The deep red color from anthocyanins intensifies in cooler weather." },
  { fruit_id: "blood-oranges", category: "ripeness", content: "A ripe blood orange feels heavy for its size and yields slightly to pressure. The skin may still be partially orange when ripe — full red-blush skin indicates peak ripeness. The flesh ranges from orange-streaked to deep crimson depending on the cold exposure during growth. Smell the navel end — a sweet citrus aroma indicates readiness." },
  { fruit_id: "blood-oranges", category: "storage", content: "Store blood oranges at room temperature for up to 1 week, or in the refrigerator crisper drawer for up to 4 weeks. Bring to room temperature before eating for peak flavor. Once cut, wrap tightly in plastic and refrigerate — use within 3 days." },
  { fruit_id: "blood-oranges", category: "flavor", content: "Blood oranges have a complex flavor profile: sweet and citrusy with a distinct berry-like undertone (often described as raspberry or strawberry). This comes from anthocyanins — the same antioxidant found in blueberries and pomegranates. The flavor is more complex and less one-dimensional than a navel orange, making them ideal for vinaigrettes, desserts, and cocktails." },
  { fruit_id: "blood-oranges", category: "pairing", content: "Blood oranges pair beautifully with: dark chocolate, honey, vanilla, rosemary, fennel, arugula, ricotta, goat cheese, almonds, and avocado. The red juice makes a stunning vinaigrette base. Try segmenting over burrata with olive oil and sea salt for an elegant appetizer." },
  { fruit_id: "blood-oranges", category: "cooking", content: "Use blood oranges in salad dressings, sauces, curd, tarts, and glazes. The juice reduces beautifully into a vibrant sauce for duck, salmon, or pork. Segment them over salads for visual impact. The zest adds a floral-berry note to baked goods. Juice immediately loses its red color when heated — for visual impact, keep it raw." },

  // NAVAL ORANGES
  { fruit_id: "naval-oranges", category: "shelf_life", content: "Naval oranges keep well — up to 2 weeks at room temperature and up to 1 month refrigerated. They are one of the most stable fruits in terms of shelf life, making them low urgency in weekly planning. Peak season is November through April in coastal California." },
  { fruit_id: "naval-oranges", category: "ripeness", content: "Ripe naval oranges are firm and heavy for their size with bright, uniform orange skin. The 'navel' at one end (the secondary fruit) should be tight and small — a large open navel indicates overripeness. Avoid any with soft spots, wrinkled skin, or green patches (though slight greening on California oranges can be normal and doesn't affect flavor)." },
  { fruit_id: "naval-oranges", category: "storage", content: "Naval oranges can sit on the counter at room temperature for 1-2 weeks. For longer storage, keep in the refrigerator crisper drawer up to 4 weeks. They do not continue to ripen after picking, so buy at your desired ripeness level. Avoid storing near ethylene-producing fruits (apples, avocados) as this can cause surface mold." },
  { fruit_id: "naval-oranges", category: "flavor", content: "Naval oranges are the classic sweet, mild, seedless orange. The coastal California climate (warm days, cool nights, ocean air) concentrates sugars while maintaining brightness. They are sweeter and less acidic than Valencia oranges, making them ideal for eating out of hand, juicing, and adding to breakfast dishes. The zest is highly aromatic." },
  { fruit_id: "naval-oranges", category: "pairing", content: "Naval oranges pair well with: vanilla, cinnamon, honey, ginger, dark chocolate, almonds, yogurt, granola, chicken, and leafy greens. Classic combinations include orange-honey glaze for salmon, orange vinaigrette for spinach salad, and orange zest in baked goods. The juice reduces into a beautiful glaze for poultry." },
  { fruit_id: "naval-oranges", category: "cooking", content: "Naval oranges are versatile in cooking. Segment them into salads, reduce the juice into glazes, use the zest in baking, or blend into smoothies. Orange curd, marmalade, and orange-glazed proteins are classic preparations. The entire orange can be used — flesh, juice, and zest each contribute differently." },

  // LEMONS
  { fruit_id: "lemons", category: "shelf_life", content: "Lemons last 1-2 weeks at room temperature and up to 4-6 weeks refrigerated. They are very low urgency in weekly planning. The thin-skinned Eureka variety grown in coastal Encinitas has exceptional juice yield — up to 3 tablespoons per lemon. Cut lemons should be wrapped and refrigerated, used within 2-3 days." },
  { fruit_id: "lemons", category: "ripeness", content: "Ripe lemons are fully yellow, firm, and feel heavy for their size. Thin-skinned lemons (like Eureka) produce more juice than thick-skinned varieties. A slight give when pressed indicates peak ripeness and juice content. Green patches are normal on freshly picked lemons — they ripen to full yellow within days at room temperature." },
  { fruit_id: "lemons", category: "storage", content: "Lemons at room temperature last up to 2 weeks. Refrigerated in a sealed bag or airtight container, they last 4-6 weeks. Rolling a lemon on the counter before squeezing releases more juice. Microwave for 10 seconds before cutting — significantly increases juice yield. Zest lemons before juicing and freeze zest in small portions for later use." },
  { fruit_id: "lemons", category: "flavor", content: "Encinitas Eureka lemons have a thin rind with intense floral aroma and high acidity. The zest is particularly fragrant — more aromatic than grocery store lemons that sit in cold storage. The bright, clean acidity makes them essential in both savory and sweet cooking. Fresh-squeezed lemon juice has a complexity that bottled juice cannot replicate." },
  { fruit_id: "lemons", category: "pairing", content: "Lemons pair with essentially everything. Classic savory pairings: garlic, olive oil, herbs (thyme, rosemary, oregano), capers, fish, chicken, pasta. Classic sweet pairings: sugar, butter, eggs (lemon curd), berries, vanilla, cream. Lemon zest enhances any dish where you want brightness without adding liquid." },
  { fruit_id: "lemons", category: "cooking", content: "Use lemons to brighten finished dishes (a squeeze over pasta, fish, or soup), as a marinade acid (lemon + olive oil + garlic for chicken), in baking (zest for flavor, juice for acid activation of baking soda), and in vinaigrettes. Add lemon juice at the end of cooking for maximum brightness — extended heat dulls lemon flavor." },

  // LIMES
  { fruit_id: "limes", category: "shelf_life", content: "Limes last 1-2 weeks at room temperature and up to 4-5 weeks refrigerated. They are low urgency in weekly planning. Persian limes (seedless, the variety grown in Encinitas) are picked slightly underripe and mature off the tree. Peak season is summer, but Persian limes are available year-round." },
  { fruit_id: "limes", category: "ripeness", content: "Persian limes are ripe when they transition from dark green to a slightly lighter, more yellow-green. Avoid limes that feel light (dried out) or have yellow spots (overripe). Firm but slightly yielding texture indicates peak juice content. Smaller limes are often juicier than large ones for their size." },
  { fruit_id: "limes", category: "storage", content: "Keep limes at room temperature up to 1 week, or refrigerate for up to 5 weeks. Do not store in plastic — they need some air circulation to prevent mold. Rolling on the counter before cutting maximizes juice yield. Lime zest freezes well — zest several limes at once and freeze in tablespoon portions." },
  { fruit_id: "limes", category: "flavor", content: "Persian limes have a sharp, clean acidity with a slightly floral aroma and less bitterness than Key limes. The Encinitas coastal climate produces particularly aromatic limes — more fragrant than store-bought due to the thinner rind and fresher pickup. The zest is especially prized for its concentrated lime oil." },
  { fruit_id: "limes", category: "pairing", content: "Limes are essential in Mexican, Thai, Vietnamese, and Caribbean cuisines. Classic pairings: cilantro, jalapeño, avocado, coconut, ginger, fish sauce, soy sauce, cumin, garlic. In drinks: mint (mojito), ginger beer (Moscow mule), tequila (margarita). The zest adds a floral-citrus note that juice alone cannot provide." },
  { fruit_id: "limes", category: "cooking", content: "Use lime juice at the end of cooking in curries, ceviches, and salsas — the acidity brightens and balances rich flavors. Lime juice marinades tenderize proteins effectively. In baking, lime zest adds more flavor than juice. Lime leaf (kaffir lime) is a separate ingredient used in Southeast Asian cooking." },

  // POMEGRANATES
  { fruit_id: "pomegranates", category: "shelf_life", content: "Pomegranates are the most shelf-stable fruit Ballow Fruit Co. offers — lasting 1-2 months at room temperature and 2-3 months refrigerated. This makes them the lowest urgency item in any weekly plan. Individual arils (seeds) keep in a sealed container in the refrigerator for up to 5 days once extracted. Juice can be refrigerated for 5-7 days." },
  { fruit_id: "pomegranates", category: "ripeness", content: "A ripe pomegranate feels heavy for its size and has a leathery, slightly dried skin that may be cracking at the crown — this is a sign of peak ripeness, not spoilage. The skin color ranges from pink to deep red-burgundy. Avoid any with soft spots or green patches. Tap it — a metallic sound indicates developed arils." },
  { fruit_id: "pomegranates", category: "storage", content: "Pomegranates store beautifully at room temperature for 1-2 months, making them ideal for kitchen display. Once cut, cover tightly and refrigerate for up to 3 days. To extract arils cleanly without juice spray: score the crown and sides, submerge in cold water in a bowl, and break apart — arils sink, white pith floats." },
  { fruit_id: "pomegranates", category: "flavor", content: "The Wonderful variety pomegranate (grown in Encinitas) has the deepest red arils with the best balance of sweet and tart. The flavor has a wine-like complexity — earthy, slightly tannic, with a bright berry finish. Each aril contains a small white seed that is edible but slightly crunchy. The juice is intensely colored and flavored." },
  { fruit_id: "pomegranates", category: "pairing", content: "Pomegranates pair elegantly with: arugula, feta cheese, walnuts, goat cheese, grains (quinoa, farro, wild rice), lamb, duck, dark chocolate, orange, pomegranate molasses, and Middle Eastern spices (za'atar, sumac, cumin). The arils add texture, color, and sweet-tart contrast to virtually any salad or grain bowl." },
  { fruit_id: "pomegranates", category: "cooking", content: "Scatter arils over salads, grain bowls, yogurt, and desserts. Reduce pomegranate juice into a molasses for glazes and dressings. Blend into a vinaigrette. Stir arils into oatmeal or overnight oats. In Middle Eastern cooking, pomegranate molasses (pomegranate juice reduced to syrup) is essential in dishes like muhammara and fesenjan." },
];

// ── Nutrition Knowledge ────────────────────────────────────────────────────────
// USDA-based macros, vitamins, minerals, and health benefits per fruit.
// Each chunk is a searchable fact for matching dietary goals.

const nutritionKnowledge = [
  // AVOCADOS
  { fruit_id: "avocados", category: "macros", content: "Per 100g of avocado: 160 calories, 2g protein, 15g fat (predominantly monounsaturated oleic acid), 9g carbohydrates, 7g dietary fiber. One half avocado (about 70g) contains approximately 112 calories and 5g fiber. Avocados are one of the highest-fat whole fruits, but the fat is the same type found in olive oil and associated with cardiovascular health." },
  { fruit_id: "avocados", category: "vitamins", content: "Avocados are rich in Vitamin K (26% DV per 100g), Folate (20% DV), Vitamin C (17% DV), Vitamin B5 (14% DV), Vitamin B6 (13% DV), and Vitamin E (10% DV). The fat content significantly enhances absorption of fat-soluble vitamins (A, D, E, K) from other foods eaten at the same meal." },
  { fruit_id: "avocados", category: "minerals", content: "Avocados contain significant Potassium (485mg per 100g, more than bananas), Magnesium (29mg), Copper (0.19mg), and Manganese (0.14mg). Potassium is essential for heart health, muscle function, and blood pressure regulation. Avocados have more potassium per calorie than almost any other food." },
  { fruit_id: "avocados", category: "health_benefits", content: "Avocados support heart health through monounsaturated fats and potassium. The high fiber content (7g per 100g) promotes digestive health and sustained satiety — making them excellent for weight management goals. The oleic acid in avocados has anti-inflammatory properties. Daily avocado consumption is associated with improved cholesterol profiles in clinical studies." },
  { fruit_id: "avocados", category: "serving_info", content: "One serving of avocado is typically 1/3 of a medium avocado (50g, ~80 calories). For a high-fiber goal, half an avocado provides 4.5g fiber (16% of daily value). For a high-fat/ketogenic goal, avocados are ideal — 15g fat per 100g with minimal sugar (0.7g). For calorie management, portion size is the key variable." },

  // BLOOD ORANGES
  { fruit_id: "blood-oranges", category: "macros", content: "Per 100g of blood orange: 50 calories, 1g protein, 0.3g fat, 12g carbohydrates, 2.2g dietary fiber. Moderate sugar (8.6g per 100g) with low glycemic impact due to fiber content. One medium blood orange (about 150g) provides 75 calories and 3.3g fiber." },
  { fruit_id: "blood-oranges", category: "vitamins", content: "Blood oranges are exceptional in Vitamin C — 50mg per 100g (56% DV), supporting immune function and collagen synthesis. They also contain Vitamin A (from beta-carotene), Folate (5% DV), Thiamine (7% DV), and Vitamin B6 (5% DV). The anthocyanins that give them their red color are potent antioxidants not found in regular oranges." },
  { fruit_id: "blood-oranges", category: "minerals", content: "Blood oranges provide Calcium (40mg per 100g, 4% DV), Potassium (179mg, 5% DV), and Magnesium (10mg, 2% DV). The calcium content is notable for a fruit. The potassium supports cardiovascular health. Phosphorus (17mg) supports bone health." },
  { fruit_id: "blood-oranges", category: "health_benefits", content: "Blood oranges contain anthocyanins — powerful antioxidants that reduce inflammation, support eye health, and are associated with reduced cancer risk. These compounds are rare in citrus fruits and make blood oranges nutritionally distinct from regular oranges. Vitamin C content supports immune function and iron absorption. The flavanones in citrus support cardiovascular health." },
  { fruit_id: "blood-oranges", category: "serving_info", content: "One medium blood orange (150g) provides 75 calories, 56mg Vitamin C (62% DV), and 3.3g fiber. For a high-antioxidant or anti-inflammatory dietary goal, blood oranges are among the most effective choices. Combine with avocado to create a meal with complementary fat-soluble vitamin absorption." },

  // NAVAL ORANGES
  { fruit_id: "naval-oranges", category: "macros", content: "Per 100g of naval orange: 47 calories, 0.9g protein, 0.1g fat, 12g carbohydrates, 2.4g dietary fiber, 9.4g sugar. One medium navel orange (about 140g) provides 66 calories and 3.4g fiber. The low calorie density makes them ideal for weight management — high volume, low calories, high fiber." },
  { fruit_id: "naval-oranges", category: "vitamins", content: "Naval oranges provide excellent Vitamin C (53mg per 100g, 59% DV) — a single orange meets the daily requirement for most adults. Also contain Folate (9% DV), Thiamine (8% DV), Vitamin A (4% DV from beta-carotene), and Vitamin B6 (5% DV). The flavonoids hesperidin and naringenin have anti-inflammatory properties." },
  { fruit_id: "naval-oranges", category: "minerals", content: "Naval oranges contain Potassium (181mg per 100g, 5% DV), Calcium (40mg, 4% DV), and Magnesium (10mg, 2% DV). The calcium content is notable for a non-dairy food. The potassium:sodium ratio supports healthy blood pressure. Trace amounts of copper support iron absorption." },
  { fruit_id: "naval-oranges", category: "health_benefits", content: "Naval oranges support immune function through high Vitamin C, promote digestive health through fiber, and provide anti-inflammatory flavonoids. Regular citrus consumption is associated with reduced risk of kidney stones. The soluble fiber pectin supports healthy gut microbiome. Vitamin C enhances absorption of non-heme (plant-based) iron — pair with iron-rich foods for maximum benefit." },
  { fruit_id: "naval-oranges", category: "serving_info", content: "One naval orange provides a full day's Vitamin C requirement with only 66 calories. For a high-fiber goal, pair with avocado for a combined 7-10g fiber. For low-sugar goals, limit to one orange per day (9.4g sugar per 100g). The natural sugars come packaged with fiber, which slows absorption compared to juice." },

  // LEMONS
  { fruit_id: "lemons", category: "macros", content: "Per 100g of lemon: 29 calories, 1.1g protein, 0.3g fat, 9g carbohydrates, 2.8g dietary fiber, 2.5g sugar. Lemons are very low in sugar and calories, making them ideal for low-sugar and low-calorie dietary goals. Lemon juice (about 50ml per lemon) adds approximately 15 calories to a dish." },
  { fruit_id: "lemons", category: "vitamins", content: "Lemons are rich in Vitamin C (53mg per 100g, 59% DV) and provide Vitamin B6 (5% DV), Thiamine (3% DV), and Folate (3% DV). The zest contains concentrated flavonoids (limonene, hesperidin) in concentrations 5-10x higher than the juice. Vitamin C in lemon juice is preserved well in refrigeration but degrades with heat and time." },
  { fruit_id: "lemons", category: "minerals", content: "Lemons provide Potassium (138mg per 100g, 4% DV), Calcium (26mg, 3% DV), Magnesium (8mg, 2% DV), and Phosphorus (16mg). The citric acid in lemons enhances mineral absorption — particularly iron and calcium — from other foods in the meal." },
  { fruit_id: "lemons", category: "health_benefits", content: "Lemon citric acid inhibits kidney stone formation by increasing urinary citrate levels — one of the most evidence-backed dietary interventions for kidney stone prevention. The flavonoid limonene has demonstrated anti-cancer properties in research. Lemon juice before meals may improve insulin sensitivity. The low sugar content makes lemons compatible with virtually any dietary goal." },
  { fruit_id: "lemons", category: "serving_info", content: "The juice of one lemon (about 30ml) provides 8 calories and 11mg Vitamin C (12% DV). For maximum health benefit, use the whole lemon: juice for acidity, zest for flavonoids. Adding lemon juice to iron-rich meals (spinach, beans, meat) enhances iron absorption by up to 67% due to Vitamin C." },

  // LIMES
  { fruit_id: "limes", category: "macros", content: "Per 100g of lime: 30 calories, 0.7g protein, 0.2g fat, 11g carbohydrates, 2.8g dietary fiber, 1.7g sugar. Limes are the lowest-sugar fruit in the Ballow catalog — nearly sugar-free in practical serving sizes. One lime yields about 30ml juice for approximately 9 calories." },
  { fruit_id: "limes", category: "vitamins", content: "Limes provide Vitamin C (29mg per 100g, 32% DV), Vitamin B6 (4% DV), Folate (2% DV), and Thiamine (3% DV). While lower in Vitamin C than lemons, the combination of Vitamin C and citric acid still effectively enhances mineral absorption. Lime zest contains limonene and other volatile compounds with antioxidant properties." },
  { fruit_id: "limes", category: "minerals", content: "Limes contain Potassium (102mg per 100g, 3% DV), Calcium (33mg, 3% DV), and Magnesium (6mg, 1% DV). The calcium is notable. The citric acid, like in lemons, aids in mineral absorption from other foods eaten at the same meal." },
  { fruit_id: "limes", category: "health_benefits", content: "Lime juice has antioxidant and antimicrobial properties. Citric acid in limes supports kidney health (same mechanism as lemons). Limes are associated with reduced risk of infection due to Vitamin C and antimicrobial compounds in the peel. In traditional medicine, lime juice is used as a digestive aid — the acidity stimulates digestive enzyme production." },
  { fruit_id: "limes", category: "serving_info", content: "Lime juice is nearly calorie-free in typical cooking quantities. For a low-sugar dietary goal, lime is the ideal citrus choice (1.7g sugar per 100g). Lime zest provides flavor with essentially zero calories or sugar. For high-Vitamin C goals, use more juice and include other citrus." },

  // POMEGRANATES
  { fruit_id: "pomegranates", category: "macros", content: "Per 100g of pomegranate arils: 83 calories, 1.7g protein, 1.2g fat, 19g carbohydrates, 4g dietary fiber, 13.7g sugar. One medium pomegranate yields about 150g arils (125 calories, 6g fiber). Higher in calories and sugar than citrus fruits, but the exceptional antioxidant content and fiber make them nutritionally dense." },
  { fruit_id: "pomegranates", category: "vitamins", content: "Pomegranates provide Vitamin C (10mg per 100g, 11% DV), Vitamin K (16% DV) — crucial for blood clotting and bone health, Folate (16% DV), and Vitamin B6 (8% DV). The polyphenol content (punicalagins, ellagic acid) is the primary nutritional distinction — pomegranates rank among the highest polyphenol foods tested." },
  { fruit_id: "pomegranates", category: "minerals", content: "Pomegranates contain Potassium (236mg per 100g, 7% DV), Phosphorus (36mg, 4% DV), Magnesium (12mg, 3% DV), Calcium (10mg), Zinc (0.35mg), and Copper (0.16mg). The combination of potassium, magnesium, and calcium supports cardiovascular and bone health. Copper and zinc support immune function." },
  { fruit_id: "pomegranates", category: "health_benefits", content: "Pomegranates have the highest antioxidant activity of any fruit tested — 3x higher than red wine and green tea. The unique antioxidants (punicalagins, ellagitannins) are metabolized by gut bacteria into urolithins, which have powerful anti-inflammatory and anti-cancer properties. Pomegranate juice consumption is associated with reduced blood pressure, improved cholesterol, and reduced arterial plaque in multiple clinical trials. The 4g fiber per 100g supports gut microbiome diversity." },
  { fruit_id: "pomegranates", category: "serving_info", content: "A serving of pomegranate arils (about 87g, 1/2 cup) provides 72 calories, 3.5g fiber, and extraordinary antioxidant value. For high-fiber goals, pomegranates are the best choice in the Ballow catalog. For anti-inflammatory or high-antioxidant goals, pomegranates are unmatched. Higher sugar content (13.7g per 100g) means those with low-sugar goals should moderate portion size." },
];

async function main() {
  console.log("Seeding produce knowledge and nutrition knowledge...\n");

  // Wipe existing rows to allow clean re-seeding
  await supabase.from("produce_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("nutrition_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared existing knowledge rows.\n");

  // Seed produce knowledge
  console.log(`Seeding ${produceKnowledge.length} produce knowledge chunks...`);
  for (let i = 0; i < produceKnowledge.length; i++) {
    const chunk = produceKnowledge[i];
    process.stdout.write(`  [${i + 1}/${produceKnowledge.length}] ${chunk.fruit_id} / ${chunk.category}...`);

    const { data: inserted, error: insertErr } = await supabase
      .from("produce_knowledge")
      .insert(chunk)
      .select("id")
      .single();

    if (insertErr) {
      console.error(` FAILED: ${insertErr.message}`);
      continue;
    }

    const embedding = await embedText(chunk.content);
    const { error: embedErr } = await supabase
      .from("produce_knowledge")
      .update({ embedding })
      .eq("id", inserted.id);

    if (embedErr) console.error(` embed FAILED: ${embedErr.message}`);
    else console.log(" done");

    await new Promise((r) => setTimeout(r, 300));
  }

  // Seed nutrition knowledge
  console.log(`\nSeeding ${nutritionKnowledge.length} nutrition knowledge chunks...`);
  for (let i = 0; i < nutritionKnowledge.length; i++) {
    const chunk = nutritionKnowledge[i];
    process.stdout.write(`  [${i + 1}/${nutritionKnowledge.length}] ${chunk.fruit_id} / ${chunk.category}...`);

    const { data: inserted, error: insertErr } = await supabase
      .from("nutrition_knowledge")
      .insert(chunk)
      .select("id")
      .single();

    if (insertErr) {
      console.error(` FAILED: ${insertErr.message}`);
      continue;
    }

    const embedding = await embedText(chunk.content);
    const { error: embedErr } = await supabase
      .from("nutrition_knowledge")
      .update({ embedding })
      .eq("id", inserted.id);

    if (embedErr) console.error(` embed FAILED: ${embedErr.message}`);
    else console.log(" done");

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n✓ All knowledge chunks seeded successfully.");
  console.log(`  Produce: ${produceKnowledge.length} chunks`);
  console.log(`  Nutrition: ${nutritionKnowledge.length} chunks`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
