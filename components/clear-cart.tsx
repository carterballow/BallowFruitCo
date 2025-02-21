"use client";

/**
 * ClearCart — a tiny client component that clears the cart on mount.
 *
 * Why this exists: the success page is a server component (it fetches from
 * Stripe and Supabase on the server). Server components can't call browser
 * APIs like localStorage. So we drop this tiny client component into the
 * success page, which runs `clearCart()` once in the browser after the
 * payment is confirmed.
 */

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";

export default function ClearCart() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run exactly once when the success page mounts

  return null; // renders nothing — purely a side-effect component
}
