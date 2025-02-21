import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Simple admin auth check — reads the password from the request header.
// The admin layout sets this header using sessionStorage.
function isAuthorized(req: NextRequest): boolean {
  const password = req.headers.get("x-admin-password");
  return password === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/orders — returns all orders, newest first
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}

// PATCH /api/admin/orders — marks an order as "done"
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Order ID required." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("orders")
    .update({ status: "done" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
