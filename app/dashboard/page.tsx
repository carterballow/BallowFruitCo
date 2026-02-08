/**
 * /dashboard — User Home Base
 *
 * Server component — runs on the server so it can safely query Supabase directly.
 * Shows:
 *   1. Past orders (from the orders table)
 *   2. Past meal plans (from meal_plans table)
 *   3. Quick links to planner and shop
 *
 * If not logged in, redirects to login.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase";

type Order = {
  id: string;
  created_at: string;
  total_cents: number;
  items: Array<{ name: string; quantity: number; amount_cents: number }>;
  status: string;
};

type MealPlan = {
  id: string;
  week_start: string;
  created_at: string;
  cart_items: Array<{ id: string; name: string; quantity: number }>;
  plan: Array<{
    day: number;
    date: string;
    meals: Array<{ meal_type: string; recipe_title: string; fruit_used: string[] }>;
  }>;
};

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch past orders and meal plans in parallel
  const [ordersResult, plansResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, created_at, total_cents, items, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("meal_plans")
      .select("id, week_start, created_at, cart_items, plan")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const orders = (ordersResult.data ?? []) as Order[];
  const mealPlans = (plansResult.data ?? []) as MealPlan[];

  // Get user's initials for the avatar
  const email = user.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDollars(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/planner"
            className="bg-orange-500 text-white rounded-2xl p-5 hover:bg-orange-600 transition-colors"
          >
            <div className="font-semibold mb-1">Generate a New Plan</div>
            <div className="text-sm opacity-90">AI-powered 7-day meal plan from your cart</div>
          </Link>
          <Link
            href="/products"
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-orange-200 transition-colors shadow-sm"
          >
            <div className="font-semibold text-gray-900 mb-1">Shop Fruit</div>
            <div className="text-sm text-gray-500">Add this week&apos;s fruit to your cart</div>
          </Link>
          <Link
            href="/recipes"
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-orange-200 transition-colors shadow-sm"
          >
            <div className="font-semibold text-gray-900 mb-1">Browse Recipes</div>
            <div className="text-sm text-gray-500">Ideas for using your fruit this week</div>
          </Link>
        </div>

        {/* Past Meal Plans */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Past Meal Plans</h2>
            <Link href="/planner" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              New plan →
            </Link>
          </div>

          {mealPlans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">No meal plans yet.</p>
              <Link
                href="/planner"
                className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600"
              >
                Generate Your First Plan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {mealPlans.map((plan) => {
                const totalMeals = plan.plan?.reduce((sum, d) => sum + d.meals.length, 0) ?? 0;
                const fruitsUsed = [...new Set(plan.cart_items?.map((i) => i.name) ?? [])];
                return (
                  <div key={plan.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          Week of {formatDate(plan.week_start)}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {totalMeals} meals planned · {fruitsUsed.join(", ")}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {formatDate(plan.created_at)}
                      </div>
                    </div>

                    {/* Show first 3 days as a preview */}
                    {plan.plan && plan.plan.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {plan.plan.slice(0, 3).map((day) => (
                          <div key={day.day} className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
                            Day {day.day}: {day.meals[0]?.recipe_title ?? "—"}
                          </div>
                        ))}
                        {plan.plan.length > 3 && (
                          <span className="text-xs text-gray-400 px-2.5 py-1">
                            +{plan.plan.length - 3} more days
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Orders */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Order History</h2>

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">No orders yet.</p>
              <Link
                href="/products"
                className="inline-block bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{formatDollars(order.total_cents)}</div>
                    <div className="text-sm text-gray-500">
                      {(order.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">{formatDate(order.created_at)}</div>
                    <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
