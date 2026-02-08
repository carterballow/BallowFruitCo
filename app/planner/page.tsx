"use client";

/**
 * /planner — AI Weekly Recipe Planner
 *
 * This page is the main feature showcase. Here's how it works at a high level:
 *
 * 1. Auth gate: if you're not logged in, you get redirected to the login page.
 * 2. Cart summary: shows what fruits you have + how urgent each one is.
 * 3. Preferences panel: dietary goals, allergies, meals per day, skill level.
 * 4. Generate button: sends your cart + prefs to the AI planner API.
 * 5. Plan display: shows a 7-day grid of meals with fruit tags.
 * 6. Star rating: you can rate each recipe 1-5 stars — this teaches the AI
 *    your preferences so future plans get better.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { FRUIT_DATA, getShelfLifeLabel } from "@/lib/nutrition";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// ── Types that match the API response ────────────────────────────────────────

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

// ── Star Rating Component ─────────────────────────────────────────────────────
// A row of 5 clickable stars. Filled stars are orange, empty ones are gray.
// When you click a star, it fires onRate(recipeId, starCount).

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
    // Reset the "saved" checkmark after 2 seconds
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-lg leading-none transition-transform hover:scale-110"
          title={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <span className={star <= (hover || rating) ? "text-orange-400" : "text-gray-300"}>
            ★
          </span>
        </button>
      ))}
      {saving && <span className="text-xs text-gray-400 ml-1">saving...</span>}
      {saved && <span className="text-xs text-green-600 ml-1">saved</span>}
    </div>
  );
}

// ── Urgency Badge ─────────────────────────────────────────────────────────────
// A small colored badge showing shelf-life urgency.
// Red = use soon (avocados), yellow = moderate, green = lasts a while.

function UrgencyBadge({ fruitId }: { fruitId: string }) {
  const data = FRUIT_DATA[fruitId];
  if (!data) return null;

  const label = getShelfLifeLabel(fruitId);
  const color =
    data.urgencyScore >= 8
      ? "bg-red-100 text-red-700 border-red-200"
      : data.urgencyScore >= 4
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-green-100 text-green-700 border-green-200";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {label}
    </span>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function PlannerPage() {
  const router = useRouter();
  const { items: cartItems } = useCart();

  // Auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Preferences state (what the user wants to eat / avoid)
  const [dietaryGoals, setDietaryGoals] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Plan generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [wasteAlerts, setWasteAlerts] = useState<WasteAlert[]>([]);

  // ── Step 1: Check auth on mount ───────────────────────────────────────────
  // If the user is not logged in, redirect to login.
  // We do this in useEffect so it runs client-side (after hydration).
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
      } else {
        setUserId(user.id);
        setAuthChecked(true);
        loadPreferences();
      }
    });
  }, []);

  // ── Step 2: Load existing preferences from the API ────────────────────────
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
    } catch {
      // If loading fails, defaults are already set above — no problem
    }
  }

  // ── Save preferences to the API ───────────────────────────────────────────
  async function savePreferences() {
    await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dietary_goals: dietaryGoals,
        allergies,
        meals_per_day: mealsPerDay,
        skill_level: skillLevel,
      }),
    });
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  // ── Toggle helper for checkbox arrays ─────────────────────────────────────
  // Adds the value if it's not in the array, removes it if it is.
  function toggleArrayItem(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  // ── Generate the weekly plan ───────────────────────────────────────────────
  // Calls POST /api/planner/generate with the cart and current week start date.
  async function generatePlan() {
    if (!cartItems.length) {
      setError("Your cart is empty. Add some fruit first.");
      return;
    }

    setGenerating(true);
    setError(null);
    setPlan(null);
    setSummary("");

    // weekStart = this coming Monday (or today if it's Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7 || 7;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (dayOfWeek === 1 ? 0 : daysUntilMonday - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)));

    const plannerCartItems = cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
    }));

    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: plannerCartItems,
          weekStart: weekStart.toISOString().split("T")[0],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

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

  // ── Format date for display ───────────────────────────────────────────────
  // Converts "2026-03-16" → "Mon Mar 16"
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  // ── Meal type display label ───────────────────────────────────────────────
  function mealLabel(mealType: string): string {
    const labels: Record<string, string> = {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      snack: "Snack",
      drink: "Drink",
    };
    return labels[mealType] ?? mealType;
  }

  // ── Loading / auth check state ────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <p className="text-gray-500">Checking your account...</p>
      </div>
    );
  }

  // ── Page render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Recipe Planner</h1>
          <p className="text-gray-500 mt-1">
            Turn your fruit order into a personalized 7-day meal plan.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Section 1: Cart Summary ──────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Cart</h2>

          {cartItems.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No fruit in your cart yet.</p>
              <Link
                href="/products"
                className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Shop Fruit
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700">
                      {item.quantity}
                    </div>
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                  <UrgencyBadge fruitId={item.id} />
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">
                The planner schedules urgent fruit (like avocados) earlier in the week.
              </p>
            </div>
          )}
        </section>

        {/* ── Section 2: Preferences Panel ────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h2>

          <div className="space-y-6">
            {/* Dietary Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {["high-fiber", "low-sugar", "vegan", "vegetarian", "high-protein", "low-carb"].map(
                  (goal) => (
                    <button
                      key={goal}
                      onClick={() => setDietaryGoals(toggleArrayItem(dietaryGoals, goal))}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        dietaryGoals.includes(goal)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      {goal}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies / Avoid
              </label>
              <div className="flex flex-wrap gap-2">
                {["nuts", "dairy", "gluten", "eggs", "soy", "shellfish"].map((allergen) => (
                  <button
                    key={allergen}
                    onClick={() => setAllergies(toggleArrayItem(allergies, allergen))}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      allergies.includes(allergen)
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>

            {/* Meals Per Day + Skill Level */}
            <div className="flex flex-wrap gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meals per Day
                </label>
                <div className="flex gap-2">
                  {[2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMealsPerDay(n)}
                      className={`w-12 h-10 rounded-lg text-sm font-medium border transition-colors ${
                        mealsPerDay === n
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cooking Skill
                </label>
                <div className="flex gap-2">
                  {["beginner", "intermediate", "advanced"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSkillLevel(level)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                        skillLevel === level
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save preferences button */}
            <button
              onClick={savePreferences}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium underline underline-offset-2"
            >
              {prefsSaved ? "Preferences saved!" : "Save preferences for next time"}
            </button>
          </div>
        </section>

        {/* ── Section 3: Generate Button ───────────────────────────────────── */}
        <section className="text-center">
          <button
            onClick={generatePlan}
            disabled={generating || cartItems.length === 0}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-md ${
              generating || cartItems.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Building your plan...
              </>
            ) : plan ? (
              "Regenerate Plan"
            ) : (
              "Generate My 7-Day Plan"
            )}
          </button>

          {generating && (
            <p className="text-sm text-gray-400 mt-3">
              The AI is matching recipes to your cart. This takes 5-15 seconds.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-4 py-2 inline-block">
              {error}
            </p>
          )}
        </section>

        {/* ── Section 4: 7-Day Plan Display ───────────────────────────────── */}
        {plan && (
          <section className="space-y-4">
            {/* Gemini summary intro */}
            {summary && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                <p className="text-gray-700 leading-relaxed">{summary}</p>
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-900">Your Week</h2>

            <div className="space-y-4">
              {plan.map((day) => (
                <div
                  key={day.day}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                >
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                      {day.day}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Day {day.day}</div>
                      <div className="text-sm text-gray-400">{formatDate(day.date)}</div>
                    </div>
                  </div>

                  {/* Meals for this day */}
                  {day.meals.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No meals assigned for this day.</p>
                  ) : (
                    <div className="space-y-4">
                      {day.meals.map((meal) => (
                        <div
                          key={meal.recipe_id}
                          className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 pl-4 border-l-2 border-orange-100"
                        >
                          {/* Meal type label */}
                          <div className="w-24 shrink-0">
                            <span className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                              {mealLabel(meal.meal_type)}
                            </span>
                          </div>

                          {/* Recipe info */}
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{meal.recipe_title}</p>

                            {/* Fruit tags — which fruits this recipe uses */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {meal.fruit_used.map((fruitId) => (
                                <span
                                  key={fruitId}
                                  className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100"
                                >
                                  {FRUIT_DATA[fruitId]?.name ?? fruitId}
                                </span>
                              ))}
                            </div>

                            {/* Star rating */}
                            <StarRating
                              recipeId={meal.recipe_id}
                              planId={planId}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Waste Alerts ─────────────────────────────────── */}
            {wasteAlerts.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                  Use It or Lose It
                </h3>
                <div className="space-y-3">
                  {wasteAlerts.map((alert) => (
                    <div key={alert.fruit_id} className="bg-white rounded-xl p-3 border border-red-100">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-red-700 text-sm">{alert.fruit_name}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{alert.warning}</p>
                        </div>
                        <span className="shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          {alert.days_left} days
                        </span>
                      </div>
                      {alert.tip && (
                        <p className="text-xs text-gray-400 mt-2 italic border-t border-gray-50 pt-2">
                          Storage tip: {alert.tip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Grocery List ──────────────────────────────────── */}
            {groceryList.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                  Smart Grocery List
                </h3>
                <p className="text-xs text-green-700 mb-3">
                  Items to pick up this week to support your meal plan:
                </p>
                <div className="space-y-2">
                  {groceryList.map((item) => (
                    <div key={item.name} className="flex items-start gap-3">
                      <span className={`shrink-0 mt-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                        item.urgency === "this week"
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {item.urgency === "this week" ? "needed" : "optional"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate link */}
            <div className="text-center pt-2">
              <button
                onClick={generatePlan}
                disabled={generating}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium underline underline-offset-2"
              >
                Not quite right? Regenerate the plan
              </button>
              <p className="text-xs text-gray-400 mt-1">
                Rate recipes first and the next plan will match your taste better.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
