import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

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
  const pipe = await (pipeline as any)("feature-extraction", "Xenova/bge-base-en-v1.5");
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data) as number[];
}

const produceKnowledge = [
  { fruit_id: "avocados", category: "shelf_life", content: "Avocados have a very short shelf life once ripe — typically 3 to 5 days when refrigerated. Unripe avocados ripen at room temperature in 2-5 days depending on firmness. Once cut, the flesh oxidizes quickly. This makes avocados the highest-urgency fruit in any order — always plan avocado recipes for the first 3 days of the week." },
  { fruit_id: "avocados", category: "ripeness", content: "A ripe avocado yields to gentle pressure but is not mushy. The skin turns dark (almost black) when fully ripe. Remove the stem nub — if it comes off easily and is green underneath, the avocado is perfect. If it's brown underneath, it may be overripe inside." },
  { fruit_id: "avocados", category: "storage", content: "Keep unripe avocados at room temperature away from direct sunlight. To speed ripening, place in a paper bag with a banana or apple — they release ethylene gas. Once ripe, refrigerate to slow the process. Rub cut surfaces with lime or lemon juice to prevent browning for up to 24 hours." },
  { fruit_id: "avocados", category: "flavor", content: "Hass avocados have a rich, buttery, nutty flavor with a creamy texture. The fat content (about 15g per half) is predominantly heart-healthy monounsaturated fat. They pair exceptionally well with citrus (especially lime and lemon), salt, tomato, onion, cilantro, and eggs." },
  { fruit_id: "avocados", category: "pairing", content: "Avocados pair well with: lime juice (prevents browning, adds brightness), blood oranges (sweet-tart contrast), red onion, garlic, cilantro, eggs, feta cheese, arugula, smoked salmon, and chili flakes. In cooking, avocados are best used raw or at room temperature — heat turns them bitter." },
  { fruit_id: "avocados", category: "cooking", content: "Avocados are best served raw. Use in guacamole, avocado toast, salads, smoothies, and as a topping for tacos and grain bowls. When making guacamole, add lime juice first to prevent browning." },
  { fruit_id: "blood-oranges", category: "shelf_life", content: "Blood oranges last 1-2 weeks at room temperature and 3-4 weeks when refrigerated. Unlike avocados, they are stable and low-urgency in the weekly plan. Their peak flavor is from December through March." },
  { fruit_id: "blood-oranges", category: "ripeness", content: "A ripe blood orange feels heavy for its size and yields slightly to pressure. The skin may still be partially orange when ripe — full red-blush skin indicates peak ripeness. Smell the navel end — a sweet citrus aroma indicates readiness." },
  { fruit_id: "blood-oranges", category: "storage", content: "Store blood oranges at room temperature for up to 1 week, or in the refrigerator crisper drawer for up to 4 weeks. Bring to room temperature before eating for peak flavor. Once cut, wrap tightly in plastic and refrigerate — use within 3 days." },
  { fruit_id: "blood-oranges", category: "flavor", content: "Blood oranges have a complex flavor profile: sweet and citrusy with a distinct berry-like undertone (often described as raspberry or strawberry). This comes from anthocyanins — the same antioxidant found in blueberries and pomegranates." },
  { fruit_id: "blood-oranges", category: "pairing", content: "Blood oranges pair beautifully with: dark chocolate, honey, vanilla, rosemary, fennel, arugula, ricotta, goat cheese, almonds, and avocado. The red juice makes a stunning vinaigrette base." },
  { fruit_id: "blood-oranges", category: "cooking", content: "Use blood oranges in salad dressings, sauces, curd, tarts, and glazes. The juice reduces beautifully into a vibrant sauce for duck, salmon, or pork. Segment them over salads for visual impact." },
  { fruit_id: "naval-oranges", category: "shelf_life", content: "Naval oranges keep well — up to 2 weeks at room temperature and up to 1 month refrigerated. They are one of the most stable fruits in terms of shelf life, making them low urgency in weekly planning." },
  { fruit_id: "naval-oranges", category: "ripeness", content: "Ripe naval oranges are firm and heavy for their size with bright, uniform orange skin. The 'navel' at one end should be tight and small — a large open navel indicates overripeness. Avoid any with soft spots or wrinkled skin." },
  { fruit_id: "naval-oranges", category: "storage", content: "Naval oranges can sit on the counter at room temperature for 1-2 weeks. For longer storage, keep in the refrigerator crisper drawer up to 4 weeks. They do not continue to ripen after picking." },
  { fruit_id: "naval-oranges", category: "flavor", content: "Naval oranges are the classic sweet, mild, seedless orange. The coastal California climate concentrates sugars while maintaining brightness. They are sweeter and less acidic than Valencia oranges, making them ideal for eating out of hand, juicing, and adding to breakfast dishes." },
  { fruit_id: "naval-oranges", category: "pairing", content: "Naval oranges pair well with: vanilla, cinnamon, honey, ginger, dark chocolate, almonds, yogurt, granola, chicken, and leafy greens. Classic combinations include orange-honey glaze for salmon and orange vinaigrette for spinach salad." },
  { fruit_id: "naval-oranges", category: "cooking", content: "Naval oranges are versatile in cooking. Segment them into salads, reduce the juice into glazes, use the zest in baking, or blend into smoothies. The entire orange can be used — flesh, juice, and zest each contribute differently." },
  { fruit_id: "lemons", category: "shelf_life", content: "Lemons last 1-2 weeks at room temperature and up to 4-6 weeks refrigerated. They are very low urgency in weekly planning. The thin-skinned Eureka variety grown in coastal Encinitas has exceptional juice yield — up to 3 tablespoons per lemon." },
  { fruit_id: "lemons", category: "ripeness", content: "Ripe lemons are fully yellow, firm, and feel heavy for their size. Thin-skinned lemons (like Eureka) produce more juice than thick-skinned varieties. A slight give when pressed indicates peak ripeness and juice content." },
  { fruit_id: "lemons", category: "storage", content: "Lemons at room temperature last up to 2 weeks. Refrigerated in a sealed bag or airtight container, they last 4-6 weeks. Rolling a lemon on the counter before squeezing releases more juice. Zest lemons before juicing and freeze zest in small portions for later use." },
  { fruit_id: "lemons", category: "flavor", content: "Encinitas Eureka lemons have a thin rind with intense floral aroma and high acidity. The zest is particularly fragrant — more aromatic than grocery store lemons. The bright, clean acidity makes them essential in both savory and sweet cooking." },
  { fruit_id: "lemons", category: "pairing", content: "Lemons pair with essentially everything. Classic savory pairings: garlic, olive oil, herbs (thyme, rosemary, oregano), capers, fish, chicken, pasta. Classic sweet pairings: sugar, butter, eggs (lemon curd), berries, vanilla, cream." },
  { fruit_id: "lemons", category: "cooking", content: "Use lemons to brighten finished dishes, as a marinade acid, in baking, and in vinaigrettes. Add lemon juice at the end of cooking for maximum brightness — extended heat dulls lemon flavor." },
  { fruit_id: "limes", category: "shelf_life", content: "Limes last 1-2 weeks at room temperature and up to 4-5 weeks refrigerated. They are low urgency in weekly planning. Persian limes (seedless, the variety grown in Encinitas) are picked slightly underripe and mature off the tree." },
  { fruit_id: "limes", category: "ripeness", content: "Persian limes are ripe when they transition from dark green to a slightly lighter, more yellow-green. Avoid limes that feel light (dried out) or have yellow spots (overripe). Firm but slightly yielding texture indicates peak juice content." },
  { fruit_id: "limes", category: "storage", content: "Keep limes at room temperature up to 1 week, or refrigerate for up to 5 weeks. Do not store in plastic — they need some air circulation to prevent mold. Rolling on the counter before cutting maximizes juice yield." },
  { fruit_id: "limes", category: "flavor", content: "Persian limes have a sharp, clean acidity with a slightly floral aroma and less bitterness than Key limes. The Encinitas coastal climate produces particularly aromatic limes due to the thinner rind and fresher pickup." },
  { fruit_id: "limes", category: "pairing", content: "Limes are essential in Mexican, Thai, Vietnamese, and Caribbean cuisines. Classic pairings: cilantro, jalapeño, avocado, coconut, ginger, fish sauce, soy sauce, cumin, garlic." },
  { fruit_id: "limes", category: "cooking", content: "Use lime juice at the end of cooking in curries, ceviches, and salsas. Lime juice marinades tenderize proteins effectively. In baking, lime zest adds more flavor than juice." },
  { fruit_id: "pomegranates", category: "shelf_life", content: "Pomegranates are the most shelf-stable fruit Ballow Fruit Co. offers — lasting 1-2 months at room temperature and 2-3 months refrigerated. This makes them the lowest urgency item in any weekly plan. Individual arils keep in a sealed container in the refrigerator for up to 5 days once extracted." },
  { fruit_id: "pomegranates", category: "ripeness", content: "A ripe pomegranate feels heavy for its size and has a leathery, slightly dried skin that may be cracking at the crown — this is a sign of peak ripeness, not spoilage. The skin color ranges from pink to deep red-burgundy." },
  { fruit_id: "pomegranates", category: "storage", content: "Pomegranates store beautifully at room temperature for 1-2 months. Once cut, cover tightly and refrigerate for up to 3 days. To extract arils cleanly without juice spray: score the crown and sides, submerge in cold water in a bowl, and break apart — arils sink, white pith floats." },
  { fruit_id: "pomegranates", category: "flavor", content: "The Wonderful variety pomegranate has the deepest red arils with the best balance of sweet and tart. The flavor has a wine-like complexity — earthy, slightly tannic, with a bright berry finish. Each aril contains a small white seed that is edible but slightly crunchy." },
  { fruit_id: "pomegranates", category: "pairing", content: "Pomegranates pair elegantly with: arugula, feta cheese, walnuts, goat cheese, grains (quinoa, farro, wild rice), lamb, duck, dark chocolate, orange, pomegranate molasses, and Middle Eastern spices." },
  { fruit_id: "pomegranates", category: "cooking", content: "Scatter arils over salads, grain bowls, yogurt, and desserts. Reduce pomegranate juice into a molasses for glazes and dressings. Stir arils into oatmeal or overnight oats." },
];

const nutritionKnowledge = [
  { fruit_id: "avocados", category: "macros", content: "Per 100g of avocado: 160 calories, 2g protein, 15g fat (predominantly monounsaturated oleic acid), 9g carbohydrates, 7g dietary fiber. One half avocado (about 70g) contains approximately 112 calories and 5g fiber." },
  { fruit_id: "avocados", category: "vitamins", content: "Avocados are rich in Vitamin K (26% DV per 100g), Folate (20% DV), Vitamin C (17% DV), Vitamin B5 (14% DV), Vitamin B6 (13% DV), and Vitamin E (10% DV). The fat content significantly enhances absorption of fat-soluble vitamins from other foods eaten at the same meal." },
  { fruit_id: "avocados", category: "health_benefits", content: "Avocados support heart health through monounsaturated fats and potassium. The high fiber content (7g per 100g) promotes digestive health and sustained satiety. The oleic acid in avocados has anti-inflammatory properties." },
  { fruit_id: "avocados", category: "serving_info", content: "One serving of avocado is typically 1/3 of a medium avocado (50g, ~80 calories). For a high-fiber goal, half an avocado provides 4.5g fiber (16% of daily value). For a high-fat/ketogenic goal, avocados are ideal — 15g fat per 100g with minimal sugar (0.7g)." },
  { fruit_id: "blood-oranges", category: "macros", content: "Per 100g of blood orange: 50 calories, 1g protein, 0.3g fat, 12g carbohydrates, 2.2g dietary fiber. One medium blood orange (about 150g) provides 75 calories and 3.3g fiber." },
  { fruit_id: "blood-oranges", category: "vitamins", content: "Blood oranges are exceptional in Vitamin C — 50mg per 100g (56% DV). They also contain Vitamin A (from beta-carotene), Folate (5% DV), and Thiamine (7% DV). The anthocyanins that give them their red color are potent antioxidants not found in regular oranges." },
  { fruit_id: "blood-oranges", category: "health_benefits", content: "Blood oranges contain anthocyanins — powerful antioxidants that reduce inflammation and are associated with reduced cancer risk. These compounds are rare in citrus fruits and make blood oranges nutritionally distinct from regular oranges." },
  { fruit_id: "blood-oranges", category: "serving_info", content: "One medium blood orange (150g) provides 75 calories, 56mg Vitamin C (62% DV), and 3.3g fiber. For a high-antioxidant or anti-inflammatory dietary goal, blood oranges are among the most effective choices." },
  { fruit_id: "naval-oranges", category: "macros", content: "Per 100g of naval orange: 47 calories, 0.9g protein, 0.1g fat, 12g carbohydrates, 2.4g dietary fiber, 9.4g sugar. One medium navel orange (about 140g) provides 66 calories and 3.4g fiber." },
  { fruit_id: "naval-oranges", category: "vitamins", content: "Naval oranges provide excellent Vitamin C (53mg per 100g, 59% DV) — a single orange meets the daily requirement for most adults. Also contain Folate (9% DV), Thiamine (8% DV), and Vitamin A (4% DV from beta-carotene)." },
  { fruit_id: "naval-oranges", category: "health_benefits", content: "Naval oranges support immune function through high Vitamin C, promote digestive health through fiber, and provide anti-inflammatory flavonoids. Regular citrus consumption is associated with reduced risk of kidney stones." },
  { fruit_id: "naval-oranges", category: "serving_info", content: "One naval orange provides a full day's Vitamin C requirement with only 66 calories. For a high-fiber goal, pair with avocado for a combined 7-10g fiber. The natural sugars come packaged with fiber, which slows absorption compared to juice." },
  { fruit_id: "lemons", category: "macros", content: "Per 100g of lemon: 29 calories, 1.1g protein, 0.3g fat, 9g carbohydrates, 2.8g dietary fiber, 2.5g sugar. Lemons are very low in sugar and calories, making them ideal for low-sugar and low-calorie dietary goals." },
  { fruit_id: "lemons", category: "vitamins", content: "Lemons are rich in Vitamin C (53mg per 100g, 59% DV) and provide Vitamin B6 (5% DV) and Thiamine (3% DV). The zest contains concentrated flavonoids in concentrations 5-10x higher than the juice." },
  { fruit_id: "lemons", category: "health_benefits", content: "Lemon citric acid inhibits kidney stone formation by increasing urinary citrate levels — one of the most evidence-backed dietary interventions for kidney stone prevention. The low sugar content makes lemons compatible with virtually any dietary goal." },
  { fruit_id: "lemons", category: "serving_info", content: "The juice of one lemon (about 30ml) provides 8 calories and 11mg Vitamin C (12% DV). Adding lemon juice to iron-rich meals enhances iron absorption by up to 67% due to Vitamin C." },
  { fruit_id: "limes", category: "macros", content: "Per 100g of lime: 30 calories, 0.7g protein, 0.2g fat, 11g carbohydrates, 2.8g dietary fiber, 1.7g sugar. Limes are the lowest-sugar fruit in the Ballow catalog." },
  { fruit_id: "limes", category: "vitamins", content: "Limes provide Vitamin C (29mg per 100g, 32% DV), Vitamin B6 (4% DV), and Folate (2% DV). Lime zest contains limonene and other volatile compounds with antioxidant properties." },
  { fruit_id: "limes", category: "health_benefits", content: "Lime juice has antioxidant and antimicrobial properties. Citric acid in limes supports kidney health. For a low-sugar dietary goal, lime is the ideal citrus choice (1.7g sugar per 100g)." },
  { fruit_id: "limes", category: "serving_info", content: "Lime juice is nearly calorie-free in typical cooking quantities. Lime zest provides flavor with essentially zero calories or sugar. For high-Vitamin C goals, use more juice and include other citrus." },
  { fruit_id: "pomegranates", category: "macros", content: "Per 100g of pomegranate arils: 83 calories, 1.7g protein, 1.2g fat, 19g carbohydrates, 4g dietary fiber, 13.7g sugar. One medium pomegranate yields about 150g arils (125 calories, 6g fiber)." },
  { fruit_id: "pomegranates", category: "vitamins", content: "Pomegranates provide Vitamin C (10mg per 100g, 11% DV), Vitamin K (16% DV), Folate (16% DV), and Vitamin B6 (8% DV). The polyphenol content (punicalagins, ellagic acid) is the primary nutritional distinction." },
  { fruit_id: "pomegranates", category: "health_benefits", content: "Pomegranates have the highest antioxidant activity of any fruit tested — 3x higher than red wine and green tea. Pomegranate juice consumption is associated with reduced blood pressure, improved cholesterol, and reduced arterial plaque in multiple clinical trials." },
  { fruit_id: "pomegranates", category: "serving_info", content: "A serving of pomegranate arils (about 87g, 1/2 cup) provides 72 calories, 3.5g fiber, and extraordinary antioxidant value. For high-fiber goals, pomegranates are the best choice in the Ballow catalog." },
];

async function main() {
  console.log("Seeding produce knowledge and nutrition knowledge...\n");

  await supabase.from("produce_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("nutrition_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared existing knowledge rows.\n");

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

  console.log("\nAll knowledge chunks seeded successfully.");
  console.log(`  Produce: ${produceKnowledge.length} chunks`);
  console.log(`  Nutrition: ${nutritionKnowledge.length} chunks`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
