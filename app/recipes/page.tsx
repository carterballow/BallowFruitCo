import ScrollReveal from "@/components/scroll-reveal";

const recipes = [
  {
    title: "Blood Orange Salad",
    time: "10 min",
    difficulty: "Easy",
    description:
      "Slice blood oranges thin, fan over arugula, add shaved fennel, drizzle with olive oil and a pinch of flaky salt. The visual alone is worth it.",
    ingredients: [
      "3 blood oranges, sliced thin",
      "2 cups arugula",
      "½ fennel bulb, shaved",
      "Olive oil, flaky sea salt",
      "Optional: goat cheese, pistachios",
    ],
    color: "#F97316",
    bg: "from-orange-50 to-red-50",
  },
  {
    title: "Naval Orange Vinaigrette",
    time: "5 min",
    difficulty: "Easy",
    description:
      "Fresh-squeezed naval orange juice, Dijon, sherry vinegar, and olive oil. Bright and citrusy — transforms any salad or grain bowl.",
    ingredients: [
      "Juice of 2 naval oranges",
      "1 tsp Dijon mustard",
      "1 tbsp sherry vinegar",
      "¼ cup olive oil",
      "Salt and pepper",
    ],
    color: "#EA580C",
    bg: "from-amber-50 to-orange-50",
  },
  {
    title: "Avocado Toast with Lemon",
    time: "5 min",
    difficulty: "Easy",
    description:
      "Smash ripe Hass avocado on thick sourdough, finish with a squeeze of fresh lemon and flaky salt. The lemon cuts through the richness and lifts the whole thing.",
    ingredients: [
      "1 ripe avocado",
      "2 slices sourdough, toasted",
      "Half a lemon",
      "Flaky sea salt",
      "Optional: red pepper flakes, soft-boiled egg",
    ],
    color: "#65A30D",
    bg: "from-green-50 to-lime-50",
  },
  {
    title: "Pomegranate Molasses Glaze",
    time: "15 min",
    difficulty: "Easy",
    description:
      "Reduce pomegranate juice with a little sugar and lemon until thick and syrupy. Use it on roasted chicken, lamb, or drizzled over yogurt with walnuts.",
    ingredients: [
      "2 cups fresh pomegranate juice",
      "2 tbsp sugar",
      "1 tbsp lemon juice",
    ],
    color: "#BE123C",
    bg: "from-red-50 to-rose-50",
  },
  {
    title: "Blood Orange Agua Fresca",
    time: "10 min",
    difficulty: "Easy",
    description:
      "Juice blood oranges, thin with water, sweeten lightly. The color is stunning — deep ruby red. Serve over ice with a pinch of tajín.",
    ingredients: [
      "Juice of 6 blood oranges",
      "3 cups cold water",
      "2 tbsp sugar or agave",
      "Ice, tajín to garnish",
    ],
    color: "#DC2626",
    bg: "from-red-50 to-orange-50",
  },
  {
    title: "Preserved Lemons",
    time: "10 min active / 4 weeks",
    difficulty: "Intermediate",
    description:
      "Salt-cured lemons are a Moroccan pantry staple. One jar lasts months and elevates braises, pasta, and dressings with deep citrus intensity.",
    ingredients: [
      "8 lemons, scrubbed",
      "½ cup kosher salt",
      "Bay leaves, peppercorns",
      "Extra lemon juice to cover",
    ],
    color: "#CA8A04",
    bg: "from-yellow-50 to-lime-50",
  },
];

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] px-6 py-16">
      <div className="mx-auto max-w-3xl">

        <ScrollReveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#F97316]">In the Kitchen</p>
          <h1 className="mb-3 text-4xl font-extrabold text-[#1C1917]">Recipe Ideas</h1>
          <p className="mb-14 text-[#78716C]">
            Simple ways to use what you&apos;ve ordered. No fancy technique required — just fresh ingredients.
          </p>
        </ScrollReveal>

        <div className="space-y-6">
          {recipes.map((recipe, i) => (
            <ScrollReveal key={recipe.title} delay={i * 80}>
              <div className="overflow-hidden rounded-2xl border border-[#F0E8DC] bg-white card-shadow">
                {/* Color top bar */}
                <div className={`h-2 bg-gradient-to-r ${recipe.bg}`} />
                <div className="p-6">
                  <div className="mb-4">
                    <h2 className="font-bold text-[#1C1917]">{recipe.title}</h2>
                    <div className="flex gap-3 text-xs text-[#A8A29E]">
                      <span>{recipe.time}</span>
                      <span>· {recipe.difficulty}</span>
                    </div>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-[#78716C]">{recipe.description}</p>

                  <div className="rounded-xl bg-[#FDF8F2] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: recipe.color }}>
                      Ingredients
                    </p>
                    <ul className="space-y-1">
                      {recipe.ingredients.map((ing) => (
                        <li key={ing} className="flex items-start gap-2 text-sm text-[#78716C]">
                          <span style={{ color: recipe.color }}>·</span>
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
