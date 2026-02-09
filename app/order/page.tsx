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
      setIsLoading(false);
    }
  };

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
          <p className="mb-5 text-sm text-[#6B6560]">We&apos;ll email your receipt here after payment.</p>
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

        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-[#111111] py-4 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#C8510A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Redirecting to Stripe..." : `Pay $${totalDollars} · Secure Checkout`}
        </button>

        <p className="flex items-center justify-center gap-2 text-xs text-[#9C9490]">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secure payment via Stripe. We never see your card details.
        </p>
      </div>
    </div>
  );
}
