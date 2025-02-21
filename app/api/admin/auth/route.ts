import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/auth — checks if the submitted password matches the env var.
// Returns 200 on success, 401 on failure.
// The admin layout calls this when the owner submits the login form.
export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
}
