"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-context";

export default function OrderPage() {
  const { items, removeItem, updateQty, totalCents } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const totalDollars = (totalCents / 100).toFixed(2);

  const handleCheckout = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email before checking out.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            name: i.name,
            unit: i.unit,
            price: i.price,
            quantity: i.quantity,
          })),
          customerName: name,
          customerEmail: email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      // Redirect the browser to Stripe's hosted payment page
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  // ── Empty cart state ──────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FFFBF5] px-6 text-center">
        <h1 className="mb-3 text-2xl font-bold text-[#1C1917]">Your cart is empty</h1>
        <p className="mb-8 text-[#78716C]">Add some fruit from our catalog to get started.</p>
        <Link href="/products" className="rounded-md bg-[#F97316] px-7 py-3 text-sm font-semibold text-white hover:bg-[#EA580C]">
          Shop Now
        </Link>
      </div>
    );
  }

  // ── Cart + checkout view ──────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FFFBF5] px-6 py-16">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#F97316]">Checkout</p>
            <h1 className="text-3xl font-extrabold text-[#1C1917]">Your Cart</h1>
          </div>
          <Link href="/products" className="text-sm font-medium text-[#78716C] hover:text-[#F97316]">
            ← Continue shopping
          </Link>
        </div>

        {/* Cart line items */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#F0E8DC] bg-white card-shadow">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-5 ${i < items.length - 1 ? "border-b border-[#F0E8DC]" : ""}`}
            >
              <div className="flex-1">
                <p className="font-semibold text-[#1C1917]">{item.name}</p>
                <p className="text-xs text-[#A8A29E]">{item.priceDisplay} {item.unit}</p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center rounded-lg border border-[#E0D4C4] bg-[#FDF8F2]">
                <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-3 py-1.5 text-base font-medium text-[#78716C] hover:text-[#F97316]">−</button>
                <span className="w-6 text-center text-sm font-semibold text-[#1C1917]">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-3 py-1.5 text-base font-medium text-[#78716C] hover:text-[#F97316]">+</button>
              </div>

              {/* Line total */}
              <p className="w-16 text-right font-bold text-[#1C1917]">
                ${((item.price * item.quantity) / 100).toFixed(2)}
              </p>

              <button onClick={() => removeItem(item.id)} className="ml-1 text-[#A8A29E] hover:text-red-400" aria-label="Remove">✕</button>
            </div>
          ))}

          {/* Subtotal */}
          <div className="flex items-center justify-between border-t border-[#F0E8DC] bg-[#FDF8F2] px-5 py-4">
            <span className="font-semibold text-[#1C1917]">Subtotal</span>
            <span className="text-xl font-extrabold text-[#F97316]">${totalDollars}</span>
          </div>
        </div>

        {/* Customer info */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#F0E8DC] bg-white p-6 card-shadow">
          <h2 className="mb-1 font-bold text-[#1C1917]">Your Information</h2>
          <p className="mb-4 text-xs text-[#A8A29E]">
            We&apos;ll email your receipt here after payment.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#78716C]">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-[#E0D4C4] bg-[#FFFBF5] px-3 py-2.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none focus:border-[#F97316]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#78716C]">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full rounded-lg border border-[#E0D4C4] bg-[#FFFBF5] px-3 py-2.5 text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none focus:border-[#F97316]"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full rounded-xl bg-[#F97316] py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-[#EA580C] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Redirecting to Stripe...
            </span>
          ) : (
            `Pay $${totalDollars} · Secure Checkout`
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#A8A29E]">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secure payment via Stripe. We never see your card details.
        </div>
      </div>
    </div>
  );
}
