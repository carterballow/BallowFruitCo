import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/inventory — returns current stock levels for all fruits
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("fruit_inventory")
    .select("fruit_id, fruit_name, quantity")
    .order("fruit_id");

  if (error) {
    // Table might not exist yet (migrations not run) — return empty
    return NextResponse.json([]);
  }
  return NextResponse.json(data ?? []);
}

// POST /api/inventory/decrement — called by checkout success to reduce stock
// Body: { items: [{ fruit_id: string, quantity: number }] }
export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { items } = await req.json() as {
    items: { fruit_id: string; quantity: number }[];
  };

  if (!items?.length) {
    return NextResponse.json({ success: true });
  }

  // Decrement each fruit's inventory. Uses a raw SQL update to ensure
  // we never go below 0 (can't have negative stock).
  const errors: string[] = [];
  for (const item of items) {
    const { error } = await supabase.rpc("decrement_inventory", {
      p_fruit_id: item.fruit_id,
      p_quantity: item.quantity,
    });
    if (error) errors.push(`${item.fruit_id}: ${error.message}`);
  }

  if (errors.length > 0) {
    console.error("Inventory decrement errors:", errors);
  }

  return NextResponse.json({ success: true });
}
