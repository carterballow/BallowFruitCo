import { redirect } from "next/navigation";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { getResend, OWNER_EMAIL, FROM_EMAIL } from "@/lib/resend";
import ClearCart from "@/components/clear-cart";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) redirect("/");

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
  } catch {
    redirect("/");
  }

  if (session.payment_status !== "paid") {
    redirect("/order");
  }

  const customerName = session.metadata?.customer_name ?? "Customer";
  const customerEmail = session.customer_email ?? "";
  const totalCents = session.amount_total ?? 0;
  const totalDollars = (totalCents / 100).toFixed(2);
  const lineItems = session.line_items?.data ?? [];

  let isNew = false;
  try {
    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (!existing) {
      isNew = true;
      await supabase.from("orders").insert({
        customer_name: customerName,
        customer_email: customerEmail,
        stripe_session_id: sessionId,
        total_cents: totalCents,
        items: lineItems.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          amount_cents: item.amount_total,
        })),
        status: "paid",
      });

      const nameToFruitId: Record<string, string> = {
        "Naval Oranges": "naval-oranges",
        "Blood Oranges": "blood-oranges",
        "Lemons": "lemons",
        "Limes": "limes",
        "Pomegranates": "pomegranates",
        "Avocados": "avocados",
      };
      const inventoryItems = lineItems
        .map((item) => ({
          fruit_id: nameToFruitId[item.description ?? ""] ?? null,
          quantity: item.quantity ?? 1,
        }))
        .filter((i) => i.fruit_id !== null) as { fruit_id: string; quantity: number }[];

      if (inventoryItems.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
        await fetch(`${baseUrl}/api/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: inventoryItems }),
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Supabase save error:", err);
  }

  if (isNew && customerEmail) {
    try {
      const resend = getResend();

      const itemsList = lineItems
        .map(
          (item) =>
            `<li>${item.quantity}× ${item.description} — $${((item.amount_total ?? 0) / 100).toFixed(2)}</li>`
        )
        .join("");

      await resend.emails.send({
        from: FROM_EMAIL(),
        to: customerEmail,
        subject: "Your Ballow Fruit Co. order is confirmed! 🍊",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1C1917">
            <div style="background:#F97316;padding:32px;text-align:center;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:24px">Order Confirmed!</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Ballow Fruit Co. · Encinitas, CA</p>
            </div>
            <div style="background:white;padding:32px;border:1px solid #F0E8DC;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin-top:0">Hi ${customerName},</p>
              <p>Your payment was successful! Here's what you ordered:</p>
              <ul style="background:#FFF7ED;border-radius:8px;padding:16px 16px 16px 32px;color:#1C1917">
                ${itemsList}
              </ul>
              <p style="font-size:18px;font-weight:bold;color:#F97316">Total: $${totalDollars}</p>
              <p>We'll be in touch soon to arrange pickup or delivery. If you have any questions, reply to this email.</p>
              <p style="color:#78716C;margin-bottom:0">— The Ballow Family, Encinitas CA 🍊</p>
            </div>
          </div>
        `,
      });

      const ownerEmail = OWNER_EMAIL();
      if (ownerEmail) {
        await resend.emails.send({
          from: FROM_EMAIL(),
          to: ownerEmail,
          subject: `🍊 New order from ${customerName} — $${totalDollars}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1C1917">
              <h2>New paid order!</h2>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Total:</strong> $${totalDollars}</p>
              <p><strong>Items:</strong></p>
              <ul>${itemsList}</ul>
              <p><strong>Stripe session:</strong> ${sessionId}</p>
              <hr style="border:none;border-top:1px solid #F0E8DC" />
              <p style="color:#78716C;font-size:12px">View all orders in your admin dashboard.</p>
            </div>
          `,
        });
      }
    } catch (err) {
      console.error("Email send error:", err);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#F8F5F0] px-6 py-16 text-center">
      <ClearCart />
      <div className="w-full max-w-md">
        <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center border border-[#E2D9CE] bg-white">
          <svg className="h-6 w-6 text-[#111111]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Order Confirmed</p>
        <h1 className="mb-3 text-3xl font-light text-[#111111]">Payment received.</h1>
        <p className="mb-1 text-sm text-[#6B6560]">Thanks, {customerName}. Your order is confirmed.</p>
        <p className="mb-8 text-sm text-[#6B6560]">
          Receipt sent to <span className="text-[#111111]">{customerEmail}</span>. We&apos;ll be in touch to arrange pickup or delivery.
        </p>

        <div className="mb-8 border border-[#E2D9CE] bg-white text-left">
          <div className="border-b border-[#E2D9CE] px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Order Summary</p>
          </div>
          {lineItems.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-[#E2D9CE] px-5 py-3 last:border-0">
              <span className="text-sm text-[#111111]">{item.quantity}× {item.description}</span>
              <span className="text-sm text-[#111111]">${((item.amount_total ?? 0) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between bg-[#F8F5F0] px-5 py-3">
            <span className="text-sm font-medium text-[#111111]">Total Paid</span>
            <span className="text-sm font-semibold text-[#111111]">${totalDollars}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/products" className="bg-[#111111] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C8510A]">
            Shop Again
          </Link>
          <Link href="/" className="border border-[#E2D9CE] bg-white px-6 py-3 text-sm font-medium text-[#111111] transition-colors hover:border-[#111111]">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
