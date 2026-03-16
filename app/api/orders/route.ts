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

    const itemsSummary = items
      .map((i: { quantity: number; unit: string; fruit: string }) => `${i.quantity}x ${i.fruit} (${i.unit})`)
      .join(", ");

    try {
      const supabase = getSupabase();
      await supabase.from("orders").insert({
        customer_name: name,
        customer_email: email,
        customer_phone: phone || null,
        items,
        message: message || null,
        status: "pending",
      });
    } catch (dbErr) {
      console.error("DB insert failed (non-fatal):", dbErr);
    }

    const ownerEmail = OWNER_EMAIL();
    if (!ownerEmail) {
      console.error("OWNER_EMAIL is not set");
      return NextResponse.json({ error: "Server configuration error: OWNER_EMAIL not set." }, { status: 500 });
    }

    const resend = getResend();

    await resend.emails.send({
      from: FROM_EMAIL(),
      to: ownerEmail,
      subject: `New Order Request from ${name}`,
      html: `
        <h2>New Order Request — Ballow Fruit Co.</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Items:</strong> ${itemsSummary}</p>
        ${message ? `<p><strong>Notes:</strong> ${message}</p>` : ""}
        <hr />
        <p style="color:#888;font-size:12px;">Reply directly to this email to follow up.</p>
      `,
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL(),
        to: email,
        subject: "Order request received — Ballow Fruit Co.",
        html: `
          <h2>Thanks, ${name}!</h2>
          <p>We got your order request and will follow up within 24 hours to confirm details and arrange pickup or local delivery.</p>
          <p><strong>You requested:</strong> ${itemsSummary}</p>
          <p>— The Ballow Family, Encinitas CA</p>
        `,
      });
    } catch (customerEmailErr) {
      console.error("Customer confirmation email failed (non-fatal):", customerEmailErr);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Order request failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
