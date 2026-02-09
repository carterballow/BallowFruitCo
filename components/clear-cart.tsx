"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";

export default function ClearCart() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, []);

  return null;
}
