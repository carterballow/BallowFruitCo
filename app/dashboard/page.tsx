/**
 * /dashboard — User Home Base
 *
 * Server component — runs on the server so it can query Supabase directly.
 * Shows past orders, past meal plans, and quick nav links.
 * Redirects to /auth/login if not logged in.
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
    <div className="bg-[#F8F5F0] min-h-screen">

      {/* Header */}
      <div className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-[#E2D9CE] bg-white text-sm font-medium text-[#111111]">
              {initials}
            </div>
            <div>
              <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Account</p>
              <h1 className="text-2xl font-light text-[#111111]">Dashboard</h1>
              <p className="text-xs text-[#9C9490]">{email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-px border border-[#E2D9CE] sm:grid-cols-3">
          <Link
            href="/planner"
            className="bg-[#111111] p-5 transition-colors hover:bg-[#C8510A]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/60 mb-1">Go to</p>
            <p className="font-medium text-white">AI Meal Planner</p>
            <p className="mt-1 text-xs text-white/70">Generate your 7-day plan</p>
          </Link>
          <Link
            href="/products"
            className="bg-white p-5 transition-colors hover:bg-[#F8F5F0]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490] mb-1">Browse</p>
            <p className="font-medium text-[#111111]">Shop Fruit</p>
            <p className="mt-1 text-xs text-[#9C9490]">Add this week&apos;s order</p>
          </Link>
          <Link
            href="/recipes"
            className="bg-white p-5 border-l border-[#E2D9CE] transition-colors hover:bg-[#F8F5F0]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490] mb-1">Explore</p>
            <p className="font-medium text-[#111111]">Recipes</p>
            <p className="mt-1 text-xs text-[#9C9490]">Ideas for your fruit</p>
          </Link>
        </div>

        {/* Past Meal Plans */}
        <section className="border border-[#E2D9CE] bg-white">
          <div className="flex items-center justify-between border-b border-[#E2D9CE] px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Past Meal Plans</p>
            <Link href="/planner" className="text-xs font-medium text-[#111111] underline underline-offset-2 hover:text-[#C8510A]">
              New plan →
            </Link>
          </div>

          {mealPlans.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="mb-4 text-sm text-[#6B6560]">No meal plans yet.</p>
              <Link
                href="/planner"
                className="inline-block bg-[#111111] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C8510A]"
              >
                Generate Your First Plan
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E2D9CE]">
              {mealPlans.map((plan) => {
                const totalMeals = plan.plan?.reduce((sum, d) => sum + d.meals.length, 0) ?? 0;
                const fruits = [...new Set(plan.cart_items?.map((i) => i.name) ?? [])];
                return (
                  <div key={plan.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#111111]">
                          Week of {formatDate(plan.week_start)}
                        </p>
                        <p className="mt-0.5 text-xs text-[#9C9490]">
                          {totalMeals} meals · {fruits.join(", ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[#9C9490]">
                        {formatDate(plan.created_at)}
                      </span>
                    </div>

                    {plan.plan && plan.plan.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {plan.plan.slice(0, 3).map((day) => (
                          <span key={day.day} className="border border-[#E2D9CE] bg-[#F8F5F0] px-2.5 py-1 text-xs text-[#6B6560]">
                            Day {day.day}: {day.meals[0]?.recipe_title ?? "—"}
                          </span>
                        ))}
                        {plan.plan.length > 3 && (
                          <span className="text-xs text-[#9C9490] px-2.5 py-1">
                            +{plan.plan.length - 3} more
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

        {/* Order History */}
        <section className="border border-[#E2D9CE] bg-white">
          <div className="border-b border-[#E2D9CE] px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Order History</p>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="mb-4 text-sm text-[#6B6560]">No orders yet.</p>
              <Link
                href="/products"
                className="inline-block bg-[#111111] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C8510A]"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E2D9CE]">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{formatDollars(order.total_cents)}</p>
                    <p className="mt-0.5 text-xs text-[#9C9490]">
                      {(order.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9C9490]">{formatDate(order.created_at)}</p>
                    <span className="mt-1 inline-block border border-[#E2D9CE] bg-[#F8F5F0] px-2 py-0.5 text-xs font-medium text-[#6B6560] capitalize">
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
