"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { useRouter } from "next/navigation";

export default function OrderPage() {
  const { items, removeItem, updateQty, totalCents, clearCart } = useCart();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<"email" | "stripe" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const totalDollars = (totalCents / 100).toFixed(2);

  const handleEmailOrder = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setIsLoading("email");
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          items: items.map((i) => ({ fruit: i.name, unit: i.unit, quantity: i.quantity, price: i.price })),
          message: `Order total: $${totalDollars}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      clearCart();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(null);
    }
  };

  const handleStripeCheckout = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setIsLoading("stripe");
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ name: i.name, unit: i.unit, price: i.price, quantity: i.quantity })),
          customerName: name,
          customerEmail: email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(null);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F8F5F0] px-6 text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Order Received</p>
        <h1 className="mb-3 text-2xl font-light text-[#111111]">We&apos;ll be in touch soon</h1>
        <p className="mb-8 max-w-sm text-sm text-[#6B6560]">
          Your order request came through. Check your inbox — we sent a confirmation to <span className="font-medium text-[#111111]">{email}</span>. We&apos;ll follow up within 24 hours to arrange pickup or local delivery.
        </p>
        <Link href="/products" className="bg-[#111111] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C8510A]">
          Back to Shop
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F8F5F0] px-6 text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#9C9490]">Cart</p>
        <h1 className="mb-3 text-2xl font-light text-[#111111]">Your cart is empty</h1>
        <p className="mb-8 text-sm text-[#6B6560]">Add some fruit from our catalog to get started.</p>
        <Link href="/products" className="bg-[#111111] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C8510A]">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F5F0]">
      <div className="border-b border-[#E2D9CE]">
        <div className="mx-auto flex max-w-2xl items-baseline justify-between px-6 py-12">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Checkout</p>
            <h1 className="text-3xl font-light tracking-tight text-[#111111]">Your Cart</h1>
          </div>
          <Link href="/products" className="text-sm text-[#9C9490] hover:text-[#111111]">
            ← Continue shopping
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">

        <div className="divide-y divide-[#E2D9CE] border border-[#E2D9CE] bg-white">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="font-medium text-[#111111]">{item.name}</p>
                <p className="text-xs text-[#9C9490]">{item.priceDisplay} {item.unit}</p>
              </div>
              <div className="flex items-center border border-[#E2D9CE]">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-3 py-1.5 text-sm text-[#6B6560] hover:text-[#111111]">−</button>
                <span className="w-6 text-center text-sm font-medium text-[#111111]">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-3 py-1.5 text-sm text-[#6B6560] hover:text-[#111111]">+</button>
              </div>
              <p className="w-14 text-right text-sm font-medium text-[#111111]">
                ${((item.price * item.quantity) / 100).toFixed(2)}
              </p>
              <button onClick={() => removeItem(item.id)} className="text-[#C8B9A8] hover:text-[#111111] text-xs ml-1" aria-label="Remove">✕</button>
            </div>
          ))}
          <div className="flex items-center justify-between bg-[#F8F5F0] px-5 py-4">
            <span className="text-sm font-medium text-[#111111]">Subtotal</span>
            <span className="font-semibold text-[#111111]">${totalDollars}</span>
          </div>
        </div>

        <div className="border border-[#E2D9CE] bg-white p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Your Information</p>
          <p className="mb-5 text-sm text-[#6B6560]">We&apos;ll send a confirmation here and follow up to arrange pickup or delivery.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full border border-[#E2D9CE] bg-[#F8F5F0] px-3 py-2.5 text-sm text-[#111111] placeholder-[#C8B9A8] outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-[#9C9490]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-[#E2D9CE] bg-[#F8F5F0] px-3 py-2.5 text-sm text-[#111111] placeholder-[#C8B9A8] outline-none focus:border-[#111111]"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleEmailOrder}
            disabled={isLoading !== null}
            className="w-full bg-[#111111] py-4 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#C8510A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading === "email" ? "Sending..." : `Send Order Request · $${totalDollars}`}
          </button>
          <p className="text-center text-xs text-[#6B6560]">
            No payment collected yet — we&apos;ll follow up directly to confirm and arrange pickup or delivery.
          </p>
        </div>

        <div className="border-t border-[#E2D9CE] pt-6 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Also available — Stripe Checkout ✦</p>
          <p className="text-xs text-[#9C9490]">
            Stripe is fully integrated and ready. Use the button above for now — online payments will go live once the business is officially licensed.
          </p>
          <button
            onClick={handleStripeCheckout}
            disabled={isLoading !== null}
            className="w-full border border-[#E2D9CE] py-3 text-sm font-medium tracking-wide text-[#6B6560] transition-colors hover:border-[#111111] hover:text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading === "stripe" ? "Redirecting..." : `Pay $${totalDollars} via Stripe`}
          </button>
        </div>
      </div>
    </div>
  );
}
