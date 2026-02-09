import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getResend, OWNER_EMAIL, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, items, message } = body;

    if (!name || !email || !items?.length) {
      return NextResponse.json(
        { error: "Name, email, and at least one item are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error: dbError } = await supabase.from("orders").insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      items,
      message: message || null,
      status: "pending",
    });

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json({ error: "Failed to save order." }, { status: 500 });
    }

    const itemsSummary = items
      .map((i: { quantity: string; unit: string; fruit: string }) => `${i.quantity} ${i.unit} of ${i.fruit}`)
      .join(", ");

    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL(),
      to: OWNER_EMAIL(),
      subject: `New Order from ${name}`,
      html: `
        <h2>New Order — Ballow Fruit Co.</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Items:</strong> ${itemsSummary}</p>
        ${message ? `<p><strong>Notes:</strong> ${message}</p>` : ""}
        <hr />
        <p style="color:#888;font-size:12px;">View all orders at your admin dashboard.</p>
      `,
    });

    await resend.emails.send({
      from: FROM_EMAIL(),
      to: email,
      subject: "We got your order! — Ballow Fruit Co.",
      html: `
        <h2>Thanks, ${name}!</h2>
        <p>We received your order and will be in touch within 24 hours to confirm
        details and arrange pickup or delivery.</p>
        <p><strong>You ordered:</strong> ${itemsSummary}</p>
        ${message ? `<p><strong>Your notes:</strong> ${message}</p>` : ""}
        <p>— The Ballow Family, Encinitas CA</p>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
