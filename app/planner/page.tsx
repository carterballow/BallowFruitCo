"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { FRUIT_DATA, getShelfLifeLabel } from "@/lib/nutrition";
import { getSupabaseBrowser } from "@/lib/supabase-browser";


type DayMeal = {
  meal_type: string;
  recipe_id: string;
  recipe_title: string;
  fruit_used: string[];
  difficulty?: string;
};

type DayPlan = {
  day: number;
  date: string;
  meals: DayMeal[];
};

type GroceryItem = {
  name: string;
  reason: string;
  urgency: "this week" | "optional";
};

type WasteAlert = {
  fruit_id: string;
  fruit_name: string;
  days_left: number;
  scheduled_days: number[];
  warning: string;
  tip: string;
};


function StarRating({
  recipeId,
  planId,
  initialRating = 0,
}: {
  recipeId: string;
  planId: string | null;
  initialRating?: number;
}) {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleRate(stars: number) {
    setRating(stars);
    setSaving(true);
    setSaved(false);
    await fetch("/api/planner/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipeId, plan_id: planId, rating: stars }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-base leading-none transition-colors"
          title={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <span className={star <= (hover || rating) ? "text-[#C8510A]" : "text-[#E2D9CE]"}>★</span>
        </button>
      ))}
      {saving && <span className="text-xs text-[#9C9490] ml-2">saving...</span>}
      {saved && <span className="text-xs text-[#6B6560] ml-2">saved</span>}
    </div>
  );
}


function UrgencyBadge({ fruitId }: { fruitId: string }) {
  const data = FRUIT_DATA[fruitId];
  if (!data) return null;
  const label = getShelfLifeLabel(fruitId);
  const color =
    data.urgencyScore >= 8
      ? "border-red-300 text-red-700 bg-red-50"
      : data.urgencyScore >= 4
      ? "border-yellow-300 text-yellow-700 bg-yellow-50"
      : "border-[#E2D9CE] text-[#6B6560] bg-white";
  return (
    <span className={`text-xs px-2 py-0.5 border font-medium ${color}`}>
      {label}
    </span>
  );
}


function Tag({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium border tracking-wide transition-colors ${
        active
          ? "bg-[#111111] text-white border-[#111111]"
          : "bg-white text-[#6B6560] border-[#E2D9CE] hover:border-[#111111]"
      }`}
    >
      {label}
    </button>
  );
}


export default function PlannerPage() {
  const router = useRouter();
  const { items: cartItems } = useCart();

  const [authChecked, setAuthChecked] = useState(false);
  const [dietaryGoals, setDietaryGoals] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [wasteAlerts, setWasteAlerts] = useState<WasteAlert[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setAuthChecked(true);
        loadPreferences();
      }
    });
  }, []);

  async function loadPreferences() {
    try {
      const res = await fetch("/api/user/preferences");
      if (res.ok) {
        const data = await res.json();
        setDietaryGoals(data.dietary_goals ?? []);
        setAllergies(data.allergies ?? []);
        setMealsPerDay(data.meals_per_day ?? 3);
        setSkillLevel(data.skill_level ?? "beginner");
      }
    } catch { /* defaults stand */ }
  }

  async function savePreferences() {
    await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dietary_goals: dietaryGoals, allergies, meals_per_day: mealsPerDay, skill_level: skillLevel }),
    });
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  async function generatePlan() {
    if (!cartItems.length) { setError("Your cart is empty. Add some fruit first."); return; }
    setGenerating(true);
    setError(null);
    setPlan(null);
    setSummary("");

    const today = new Date();
    const dow = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cartItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
          weekStart: weekStart.toISOString().split("T")[0],
          prefs: { dietary_goals: dietaryGoals, allergies, meals_per_day: mealsPerDay, skill_level: skillLevel },
          seed: Math.random(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); return; }
      setPlan(data.plan);
      setSummary(data.summary);
      setPlanId(data.planId);
      setGroceryList(data.groceryList ?? []);
      setWasteAlerts(data.wasteAlerts ?? []);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function mealLabel(t: string): string {
    return ({ breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack", drink: "Drink" }[t] ?? t);
  }

  if (!authChecked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#F8F5F0]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9C9490]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F5F0] min-h-screen">

      {/* Page header */}
      <div className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">AI Planner</p>
          <h1 className="text-4xl font-light tracking-tight text-[#111111]">Weekly Meal Plan</h1>
          <p className="mt-2 text-[#6B6560]">
            Your fruit cart, turned into a personalized 7-day recipe plan.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">

        {/* ── Cart Summary ─────────────────────────────────────────────────── */}
        <section className="border border-[#E2D9CE] bg-white">
          <div className="border-b border-[#E2D9CE] px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Your Cart</p>
          </div>
          <div className="px-6 py-5">
            {cartItems.length === 0 ? (
              <div className="py-4 text-center">
                <p className="mb-4 text-sm text-[#6B6560]">No fruit in your cart yet.</p>
                <Link
                  href="/products"
                  className="inline-block bg-[#111111] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C8510A]"
                >
                  Shop Fruit
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E2D9CE]">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center border border-[#E2D9CE] bg-[#F8F5F0] text-xs font-medium text-[#111111]">
                        {item.quantity}
                      </span>
                      <span className="text-sm font-medium text-[#111111]">{item.name}</span>
                    </div>
                    <UrgencyBadge fruitId={item.id} />
                  </div>
                ))}
                <p className="pt-3 text-xs text-[#9C9490]">
                  Avocados are always scheduled to days 1–3. They go fast.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Preferences ──────────────────────────────────────────────────── */}
        <section className="border border-[#E2D9CE] bg-white">
          <div className="border-b border-[#E2D9CE] px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Preferences</p>
          </div>
          <div className="space-y-6 px-6 py-6">

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]">Dietary Goals</p>
              <div className="flex flex-wrap gap-2">
                {["high-fiber", "low-sugar", "vegan", "vegetarian", "high-protein", "low-carb"].map((g) => (
                  <Tag key={g} label={g} active={dietaryGoals.includes(g)} onClick={() => setDietaryGoals(toggle(dietaryGoals, g))} />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]">Allergies / Avoid</p>
              <div className="flex flex-wrap gap-2">
                {["nuts", "dairy", "gluten", "eggs", "soy", "shellfish"].map((a) => (
                  <Tag key={a} label={a} active={allergies.includes(a)} onClick={() => setAllergies(toggle(allergies, a))} />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-8">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]">Meals per Day</p>
                <div className="flex gap-2">
                  {[2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMealsPerDay(n)}
                      className={`w-10 h-9 text-sm font-medium border transition-colors ${
                        mealsPerDay === n ? "bg-[#111111] text-white border-[#111111]" : "bg-white text-[#6B6560] border-[#E2D9CE] hover:border-[#111111]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]">Cooking Skill</p>
                <div className="flex gap-2">
                  {["beginner", "intermediate", "advanced"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setSkillLevel(l)}
                      className={`px-3 h-9 text-xs font-medium border capitalize transition-colors ${
                        skillLevel === l ? "bg-[#111111] text-white border-[#111111]" : "bg-white text-[#6B6560] border-[#E2D9CE] hover:border-[#111111]"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-[#E2D9CE] pt-4">
              <button
                onClick={savePreferences}
                className="text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490] underline underline-offset-2 hover:text-[#111111] transition-colors"
              >
                {prefsSaved ? "Saved." : "Save for next time"}
              </button>
            </div>
          </div>
        </section>

        {/* ── Generate ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={generatePlan}
            disabled={generating || cartItems.length === 0}
            className={`px-10 py-4 text-sm font-medium tracking-wide transition-colors ${
              generating || cartItems.length === 0
                ? "bg-[#E2D9CE] text-[#9C9490] cursor-not-allowed"
                : "bg-[#111111] text-white hover:bg-[#C8510A]"
            }`}
          >
            {generating ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Building your plan...
              </span>
            ) : plan ? (
              "Regenerate Plan"
            ) : (
              "Generate My 7-Day Plan"
            )}
          </button>

          {generating && (
            <p className="text-xs text-[#9C9490]">
              Matching recipes to your cart — this takes 5–15 seconds.
            </p>
          )}

          {error && (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* ── Plan Display ─────────────────────────────────────────────────── */}
        {plan && (
          <section className="space-y-6">

            {/* Gemini summary */}
            {summary && (
              <div className="border border-[#E2D9CE] bg-white px-6 py-5">
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Plan Summary</p>
                <p className="text-sm leading-relaxed text-[#6B6560]">{summary}</p>
              </div>
            )}

            {/* 7-day plan */}
            <div className="border border-[#E2D9CE] bg-white divide-y divide-[#E2D9CE]">
              <div className="px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Your Week</p>
              </div>
              {plan.map((day) => (
                <div key={day.day} className="px-6 py-5">
                  <div className="mb-4 flex items-baseline gap-3">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Day {day.day}</span>
                    <span className="text-xs text-[#9C9490]">{formatDate(day.date)}</span>
                  </div>

                  {day.meals.length === 0 ? (
                    <p className="text-sm italic text-[#9C9490]">No meals assigned.</p>
                  ) : (
                    <div className="space-y-4">
                      {day.meals.map((meal) => (
                        <div key={meal.recipe_id} className="flex flex-col sm:flex-row sm:gap-6">
                          <div className="w-20 shrink-0 mb-1 sm:mb-0">
                            <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]">
                              {mealLabel(meal.meal_type)}
                            </span>
                          </div>
                          <div className="flex-1 border-l border-[#E2D9CE] pl-4">
                            <p className="text-sm font-medium text-[#111111]">{meal.recipe_title}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {meal.fruit_used.map((fid) => (
                                <span key={fid} className="text-xs border border-[#E2D9CE] bg-[#F8F5F0] px-2 py-0.5 text-[#6B6560]">
                                  {FRUIT_DATA[fid]?.name ?? fid}
                                </span>
                              ))}
                            </div>
                            <StarRating recipeId={meal.recipe_id} planId={planId} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Waste Alerts */}
            {wasteAlerts.length > 0 && (
              <div className="border border-red-200 bg-white">
                <div className="border-b border-red-200 px-6 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-red-600">Use It or Lose It</p>
                </div>
                <div className="divide-y divide-red-100">
                  {wasteAlerts.map((alert) => (
                    <div key={alert.fruit_id} className="flex items-start justify-between gap-4 px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#111111]">{alert.fruit_name}</p>
                        <p className="mt-0.5 text-xs text-[#6B6560]">{alert.warning}</p>
                        {alert.tip && (
                          <p className="mt-1 text-xs text-[#9C9490]">Tip: {alert.tip}</p>
                        )}
                      </div>
                      <span className="shrink-0 border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-600">
                        {alert.days_left}d left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grocery List */}
            {groceryList.length > 0 && (
              <div className="border border-[#E2D9CE] bg-white">
                <div className="border-b border-[#E2D9CE] px-6 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Grocery List</p>
                </div>
                <div className="divide-y divide-[#E2D9CE]">
                  {groceryList.map((item) => (
                    <div key={item.name} className="flex items-start gap-4 px-6 py-3">
                      <span className={`shrink-0 mt-0.5 border px-1.5 py-0.5 text-xs font-medium ${
                        item.urgency === "this week"
                          ? "border-[#111111] text-[#111111]"
                          : "border-[#E2D9CE] text-[#9C9490]"
                      }`}>
                        {item.urgency === "this week" ? "needed" : "optional"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#111111]">{item.name}</p>
                        <p className="text-xs text-[#9C9490]">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate */}
            <div className="text-center pt-2">
              <button
                onClick={generatePlan}
                disabled={generating}
                className="text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490] underline underline-offset-2 hover:text-[#111111] transition-colors"
              >
                Not right? Regenerate the plan
              </button>
              <p className="mt-1 text-xs text-[#9C9490]">
                Rate recipes first and the next plan will match your taste better.
              </p>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
