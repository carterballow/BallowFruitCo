"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/scroll-reveal";
import { useCart, CartItem } from "@/components/cart-context";

// ─── Product catalog ──────────────────────────────────────
// Price in cents (800 = $8.00) — Stripe's required format.
// inSeason drives the entire card UI: in-season cards are full opacity
// and show an add-to-cart button; out-of-season cards are grayed out
// with an availability message instead.
const products = [
  {
    id: "naval-oranges",
    name: "Naval Oranges",
    price: 800,
    priceDisplay: "$8",
    unit: "per 5 lb bag",
    tagline: "Bright, sweet, and seedless",
    description:
      "Our naval oranges are grown in the coastal Encinitas climate — warm days, cool nights, and ocean air that makes San Diego County one of the best citrus regions in the country. No seeds, easy to peel, sweet all the way through. Picked when they're actually ready.",
    flavor: "Sweet, mild, classic orange — zero seeds",
    season: "November – April",
    inSeason: true,
    image: "/naval-orange.png",
    imagePosition: "center",
    accent: "#F97316",
    accentLight: "#FFF7ED",
  },
  {
    id: "blood-oranges",
    name: "Blood Oranges",
    price: 1000,
    priceDisplay: "$10",
    unit: "per 5 lb bag",
    tagline: "Deep ruby, complex flavor",
    description:
      "Slice one open and the flesh is a deep crimson red — caused by anthocyanins, the same antioxidant found in pomegranates and blueberries. The flavor is more complex than a navel: sweet, slightly tart, with a distinct berry undertone. They go fast every season.",
    flavor: "Sweet-tart with a subtle raspberry note",
    season: "December – March",
    inSeason: true,
    image: "/blood-orange.png",
    imagePosition: "center",
    accent: "#DC2626",
    accentLight: "#FEF2F2",
  },
  {
    id: "lemons",
    name: "Lemons",
    price: 800,
    priceDisplay: "$8",
    unit: "per 5 lb bag",
    tagline: "Bright, fragrant, incredibly juicy",
    description:
      "Eureka lemons grown in the coastal Encinitas air develop a thin, fragrant rind and exceptional juice yield. These aren't the waxy, thick-skinned lemons from the grocery store. Ours are picked fresh and often still warm from the sun.",
    flavor: "Tart, bright, intensely citrusy with a floral aroma",
    season: "Year-round, peak in winter",
    inSeason: true,
    image: "/lemon.png",
    imagePosition: "center",
    accent: "#CA8A04",
    accentLight: "#FEFCE8",
  },
  {
    id: "limes",
    name: "Limes",
    price: 800,
    priceDisplay: "$8",
    unit: "per 5 lb bag",
    tagline: "Small, potent, deeply aromatic",
    description:
      "Persian limes grown without pesticides — noticeably more aromatic than store-bought. Great in drinks, salsas, marinades, and desserts. The zest alone is worth ordering for.",
    flavor: "Tangy, slightly floral, clean acidity",
    season: "Year-round, peak in summer",
    inSeason: true,
    image: "/lime.png",
    imagePosition: "center",
    accent: "#16A34A",
    accentLight: "#F0FDF4",
  },
  {
    id: "pomegranates",
    name: "Pomegranates",
    price: 1200,
    priceDisplay: "$12",
    unit: "per bag of 4",
    tagline: "Jewel-like arils, bold flavor",
    description:
      "We grow Wonderful variety pomegranates — the deepest red arils with the best balance of sweet and tart. Available only in fall, they're one of the most labor-intensive fruits to harvest and one of the most rewarding to eat.",
    flavor: "Bold, sweet-tart, rich with wine-like complexity",
    season: "September – November",
    inSeason: false,
    image: "/pomegranate.png",
    imagePosition: "center",
    accent: "#BE123C",
    accentLight: "#FFF1F2",
  },
  {
    id: "avocados",
    name: "Avocados",
    price: 1200,
    priceDisplay: "$12",
    unit: "per bag of 6",
    tagline: "Buttery Hass, tree-ripened",
    description:
      "San Diego County is one of the premier avocado-growing regions in the world, and Encinitas is right in the heart of it. Our Hass avocados are left on the tree until they're ready — richer, nuttier flavor than anything that ripened in a shipping container.",
    flavor: "Rich, buttery, nutty with a creamy texture",
    season: "April – September",
    inSeason: false,
    // Photo has 3 avocados side-by-side — center crop lands on the
    // middle one (halved, pit visible)
    image: "/avocado.jpeg",
    imagePosition: "center",
    accent: "#65A30D",
    accentLight: "#F7FEE7",
  },
];

// ─── ProductCard ──────────────────────────────────────────
function ProductCard({
  product,
  stock,
}: {
  product: (typeof products)[0];
  stock: number | null;
}) {
  const { addItem, items, updateQty } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);

  const cartItem = items.find((i) => i.id === product.id);
  const inCart = !!cartItem;

  const handleAdd = () => {
    const item: Omit<CartItem, "quantity"> = {
      id: product.id,
      name: product.name,
      price: product.price,
      priceDisplay: product.priceDisplay,
      unit: product.unit,
    };
    if (inCart) {
      updateQty(product.id, cartItem.quantity + qty);
    } else {
      for (let i = 0; i < qty; i++) addItem(item);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    // When out of season, the whole card is subtly grayed out
    <div
      className="card-shadow card-shadow-hover flex flex-col overflow-hidden rounded-2xl border border-[#F0E8DC] bg-white transition-all"
      style={{ opacity: product.inSeason ? 1 : 0.55 }}
    >
      {/* Product photo */}
      <div className="relative h-56 w-full overflow-hidden bg-white">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          style={{ objectPosition: product.imagePosition }}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {/* Season badge — floats over the photo */}
        <span
          className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
          style={{
            backgroundColor: product.inSeason ? "#D1FAE5" : "#F3F4F6",
            color: product.inSeason ? "#065F46" : "#6B7280",
          }}
        >
          {product.inSeason ? "✓ In Season" : "Out of Season"}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1C1917]">{product.name}</h2>
            <p className="text-sm text-[#78716C]">{product.tagline}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold text-[#F97316]">{product.priceDisplay}</p>
            <p className="text-xs text-[#A8A29E]">{product.unit}</p>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setOpen(!open)}
          className="mb-4 flex items-center gap-1 text-xs font-medium text-[#78716C] hover:text-[#F97316]"
        >
          {open ? "Hide details ↑" : "Learn more about this fruit ↓"}
        </button>
        {open && (
          <div
            className="mb-5 rounded-xl p-4 text-sm leading-relaxed text-[#78716C]"
            style={{ backgroundColor: product.accentLight }}
          >
            <p className="mb-3">{product.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wide" style={{ color: product.accent }}>Flavor</p>
                <p className="mt-0.5 text-[#1C1917]">{product.flavor}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide" style={{ color: product.accent }}>Season</p>
                <p className="mt-0.5 text-[#1C1917]">{product.season}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto">
          {product.inSeason ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-[#E0D4C4] bg-[#FDF8F2]">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-base font-medium text-[#78716C] hover:text-[#F97316]">−</button>
                  <span className="w-8 text-center text-sm font-semibold text-[#1C1917]">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="px-3 py-2 text-base font-medium text-[#78716C] hover:text-[#F97316]">+</button>
                </div>
                <span className="text-xs text-[#A8A29E]">
                  ≈ ${((product.price * qty) / 100).toFixed(0)} total
                </span>
              </div>

              {/* Stock indicator */}
              {stock !== null && (
                <p className={`mb-2 text-xs font-medium ${
                  stock <= 10 ? "text-red-500" : stock <= 30 ? "text-amber-600" : "text-green-600"
                }`}>
                  {stock <= 0 ? "Out of stock" : stock <= 10 ? `Only ${stock} left` : stock <= 30 ? `${stock} remaining` : `${stock} in stock`}
                </p>
              )}

              <button
                onClick={handleAdd}
                disabled={stock !== null && stock <= 0}
                className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: added ? "#22C55E" : "#F97316" }}
              >
                {added ? "✓ Added to cart!" : inCart ? "Add more to cart" : "Add to Cart"}
              </button>

              {inCart && (
                <p className="mt-2.5 text-center text-xs text-[#78716C]">
                  {cartItem.quantity} {cartItem.quantity === 1 ? product.unit : `× ${product.unit}`} in cart —{" "}
                  <Link href="/order" className="font-medium text-[#F97316] underline underline-offset-2">View cart</Link>
                </p>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] py-3 text-center text-sm text-[#6B7280]">
              Available {product.season}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function ProductsPage() {
  const [inventory, setInventory] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data: Array<{ fruit_id: string; quantity: number }>) => {
        const map: Record<string, number> = {};
        for (const item of data) map[item.fruit_id] = item.quantity;
        setInventory(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFBF5] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#F97316]">The Catalog</p>
          <h1 className="mb-3 text-4xl font-extrabold text-[#1C1917] sm:text-5xl">Our Fruit</h1>
          <p className="mb-14 max-w-xl text-[#78716C]">
            Grayed out products are currently out of season — check back when they&apos;re available.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ScrollReveal key={p.id} delay={i * 100}>
              <ProductCard
                product={p}
                stock={inventory[p.id] !== undefined ? inventory[p.id] : null}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="mt-16 rounded-2xl border border-[#F0E8DC] bg-white p-8 text-center card-shadow">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#F97316]">Ready to order?</p>
            <h2 className="mb-3 text-2xl font-bold text-[#1C1917]">View Cart &amp; Checkout</h2>
            <p className="mb-6 text-sm text-[#78716C]">Secure payment via Stripe. Receipt sent to your email automatically.</p>
            <Link href="/order" className="inline-flex items-center gap-2 rounded-md bg-[#F97316] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[#EA580C]">
              Go to Cart →
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
