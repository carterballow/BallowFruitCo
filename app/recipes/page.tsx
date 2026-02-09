import ScrollReveal from "@/components/scroll-reveal";

const recipes = [
  {
    title: "Blood Orange Salad",
    time: "10 min",
    difficulty: "Easy",
    fruit: "Blood Oranges",
    description:
      "Slice blood oranges thin, fan over arugula, add shaved fennel, drizzle with olive oil and a pinch of flaky salt. The visual alone is worth it.",
    ingredients: [
      "3 blood oranges, sliced thin",
      "2 cups arugula",
      "½ fennel bulb, shaved",
      "Olive oil, flaky sea salt",
      "Optional: goat cheese, pistachios",
    ],
  },
  {
    title: "Naval Orange Vinaigrette",
    time: "5 min",
    difficulty: "Easy",
    fruit: "Naval Oranges",
    description:
      "Fresh-squeezed naval orange juice, Dijon, sherry vinegar, and olive oil. Bright and citrusy — transforms any salad or grain bowl.",
    ingredients: [
      "Juice of 2 naval oranges",
      "1 tsp Dijon mustard",
      "1 tbsp sherry vinegar",
      "¼ cup olive oil",
      "Salt and pepper",
    ],
  },
  {
    title: "Avocado Toast with Lemon",
    time: "5 min",
    difficulty: "Easy",
    fruit: "Avocados + Lemons",
    description:
      "Smash ripe Hass avocado on thick sourdough, finish with a squeeze of fresh lemon and flaky salt. The lemon cuts through the richness and lifts the whole thing.",
    ingredients: [
      "1 ripe avocado",
      "2 slices sourdough, toasted",
      "Half a lemon",
      "Flaky sea salt",
      "Optional: red pepper flakes, soft-boiled egg",
    ],
  },
  {
    title: "Pomegranate Molasses Glaze",
    time: "15 min",
    difficulty: "Easy",
    fruit: "Pomegranates",
    description:
      "Reduce pomegranate juice with a little sugar and lemon until thick and syrupy. Use it on roasted chicken, lamb, or drizzled over yogurt with walnuts.",
    ingredients: [
      "2 cups fresh pomegranate juice",
      "2 tbsp sugar",
      "1 tbsp lemon juice",
    ],
  },
  {
    title: "Blood Orange Agua Fresca",
    time: "10 min",
    difficulty: "Easy",
    fruit: "Blood Oranges",
    description:
      "Juice blood oranges, thin with water, sweeten lightly. The color is stunning — deep ruby red. Serve over ice with a pinch of tajín.",
    ingredients: [
      "Juice of 6 blood oranges",
      "3 cups cold water",
      "2 tbsp sugar or agave",
      "Ice, tajín to garnish",
    ],
  },
  {
    title: "Preserved Lemons",
    time: "10 min active / 4 weeks",
    difficulty: "Intermediate",
    fruit: "Lemons",
    description:
      "Salt-cured lemons are a Moroccan pantry staple. One jar lasts months and elevates braises, pasta, and dressings with deep citrus intensity.",
    ingredients: [
      "8 lemons, scrubbed",
      "½ cup kosher salt",
      "Bay leaves, peppercorns",
      "Extra lemon juice to cover",
    ],
  },
];

export default function RecipesPage() {
  return (
    <div className="bg-[#F8F5F0]">
      <div className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <ScrollReveal>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">In the Kitchen</p>
            <h1 className="text-4xl font-light tracking-tight text-[#111111] sm:text-5xl">Recipe Ideas</h1>
            <p className="mt-3 max-w-xl text-[#6B6560]">
              Simple ways to use what you&apos;ve ordered. No fancy technique — just fresh ingredients used well.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="divide-y divide-[#E2D9CE] border border-[#E2D9CE]">
          {recipes.map((recipe, i) => (
            <ScrollReveal key={recipe.title} delay={i * 60}>
              <div className="grid grid-cols-1 gap-0 bg-white sm:grid-cols-[1fr_260px]">
                <div className="p-6">
                  <div className="mb-3 flex flex-wrap items-baseline gap-3">
                    <h2 className="text-base font-medium text-[#111111]">{recipe.title}</h2>
                    <span className="text-xs text-[#9C9490]">{recipe.time} · {recipe.difficulty}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#6B6560]">{recipe.description}</p>
                  <p className="mt-3 text-xs font-medium text-[#C8510A]">{recipe.fruit}</p>
                </div>

                <div className="border-t border-[#E2D9CE] p-6 sm:border-t-0 sm:border-l">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">
                    Ingredients
                  </p>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ing) => (
                      <li key={ing} className="flex items-start gap-2.5 text-sm text-[#6B6560]">
                        <span className="mt-2 h-px w-3 shrink-0 bg-[#C8510A]" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
