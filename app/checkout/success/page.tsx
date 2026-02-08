/**
 * /checkout/success — shown after a successful Stripe payment
 *
 * Plain-English flow:
 *  1. Stripe redirects here with ?session_id=cs_xxx after payment
 *  2. We fetch the session from Stripe to verify payment actually happened
 *  3. We save the order to Supabase (with a duplicate check so refreshing is safe)
 *  4. We send a receipt email to the customer and a notification to the owner
 *  5. We show a nice confirmation UI
 *
 * This is a server component — it runs on the server, not in the browser.
 * That's why we can safely call Stripe, Supabase, and Resend here.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { getResend, OWNER_EMAIL, FROM_EMAIL } from "@/lib/resend";
import ClearCart from "@/components/clear-cart";

// In Next.js 15+, searchParams is a Promise
type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessionId = params.session_id;

  // If no session ID, something's wrong — redirect home
  if (!sessionId) redirect("/");

  // ── Fetch the Stripe session ──────────────────────────────
  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
  } catch {
    redirect("/");
  }

  // Verify the payment actually went through
  if (session.payment_status !== "paid") {
    redirect("/order");
  }

  const customerName = session.metadata?.customer_name ?? "Customer";
  const customerEmail = session.customer_email ?? "";
  const totalCents = session.amount_total ?? 0;
  const totalDollars = (totalCents / 100).toFixed(2);
  const lineItems = session.line_items?.data ?? [];

  // ── Save to Supabase (only once — check for duplicates first) ──
  let isNew = false;
  try {
    const supabase = getSupabase();

    // Check if we already processed this session
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

      // Decrement inventory for each fruit ordered.
      // Map Stripe line item descriptions back to fruit IDs.
      // Description format is the product name e.g. "Naval Oranges"
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
        }).catch(() => {});  // non-blocking — inventory failure shouldn't break success page
      }
    }
  } catch (err) {
    // Database error — log it but don't crash the page
    // Payment already went through, so we still show success
    console.error("Supabase save error:", err);
  }

  // ── Send emails (only for new orders) ────────────────────
  if (isNew && customerEmail) {
    try {
      const resend = getResend();

      const itemsList = lineItems
        .map(
          (item) =>
            `<li>${item.quantity}× ${item.description} — $${((item.amount_total ?? 0) / 100).toFixed(2)}</li>`
        )
        .join("");

      // Receipt to customer
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

      // Notification to owner
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

  // ── Success UI ────────────────────────────────────────────
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#FFFBF5] px-6 py-16 text-center">
      {/* Clears localStorage cart now that payment is done */}
      <ClearCart />
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="mb-3 text-3xl font-extrabold text-[#1C1917]">
          Payment Confirmed!
        </h1>
        <p className="mb-2 text-[#78716C]">
          Thanks, {customerName}! Your order has been received.
        </p>
        <p className="mb-8 text-[#78716C]">
          A receipt has been sent to <strong>{customerEmail}</strong>. We&apos;ll
          reach out soon to arrange pickup or delivery.
        </p>

        {/* Order summary */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#F0E8DC] bg-white text-left card-shadow">
          <div className="border-b border-[#F0E8DC] bg-[#FFF7ED] px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#F97316]">
              Order Summary
            </p>
          </div>
          {lineItems.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-[#F0E8DC] px-5 py-3 last:border-0">
              <span className="text-sm text-[#1C1917]">
                {item.quantity}× {item.description}
              </span>
              <span className="text-sm font-semibold text-[#1C1917]">
                ${((item.amount_total ?? 0) / 100).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex justify-between bg-[#FDF8F2] px-5 py-3">
            <span className="font-semibold text-[#1C1917]">Total Paid</span>
            <span className="font-extrabold text-[#F97316]">${totalDollars}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/products"
            className="rounded-md bg-[#F97316] px-6 py-3 text-sm font-semibold text-white hover:bg-[#EA580C]"
          >
            Shop Again
          </Link>
          <Link
            href="/"
            className="rounded-md border border-[#E0D4C4] bg-white px-6 py-3 text-sm font-semibold text-[#1C1917] hover:border-[#F97316] hover:text-[#F97316]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
