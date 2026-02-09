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
    image: "/bloodorange.png",
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
    image: "/pomegranite.png",
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
    image: "/avocado.png",
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
    <div
      className="flex flex-col border border-[#E2D9CE] bg-white transition-all"
      style={{ opacity: product.inSeason ? 1 : 0.5 }}
    >
      {/* Photo */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#F8F5F0]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          style={{ objectPosition: product.imagePosition }}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-medium tracking-wide ${
          product.inSeason
            ? "bg-white text-[#111111]"
            : "bg-[#111111]/70 text-white"
        }`}>
          {product.inSeason ? "In Season" : "Out of Season"}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col border-t border-[#E2D9CE] p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-medium text-[#111111]">{product.name}</h2>
            <p className="text-sm text-[#6B6560]">{product.tagline}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold text-[#111111]">{product.priceDisplay}</p>
            <p className="text-xs text-[#9C9490]">{product.unit}</p>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setOpen(!open)}
          className="mb-4 text-left text-xs text-[#9C9490] underline underline-offset-2 hover:text-[#111111]"
        >
          {open ? "Hide details" : "Details + flavor notes"}
        </button>
        {open && (
          <div className="mb-4 border-t border-[#E2D9CE] pt-4 text-sm leading-relaxed text-[#6B6560]">
            <p className="mb-3">{product.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Flavor</p>
                <p className="text-[#111111]">{product.flavor}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">Season</p>
                <p className="text-[#111111]">{product.season}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto">
          {product.inSeason ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center border border-[#E2D9CE]">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-sm text-[#6B6560] hover:text-[#111111]">−</button>
                  <span className="w-8 text-center text-sm font-medium text-[#111111]">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="px-3 py-2 text-sm text-[#6B6560] hover:text-[#111111]">+</button>
                </div>
                <span className="text-xs text-[#9C9490]">
                  ${((product.price * qty) / 100).toFixed(0)} total
                </span>
                {stock !== null && stock <= 30 && (
                  <span className={`ml-auto text-xs ${stock <= 10 ? "text-red-600" : "text-[#9C9490]"}`}>
                    {stock <= 0 ? "Out of stock" : `${stock} left`}
                  </span>
                )}
              </div>

              <button
                onClick={handleAdd}
                disabled={stock !== null && stock <= 0}
                className="w-full py-3 text-sm font-medium tracking-wide text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: added ? "#2D6A4F" : "#111111" }}
              >
                {added ? "Added" : inCart ? "Add More" : "Add to Cart"}
              </button>

              {inCart && (
                <p className="mt-2 text-center text-xs text-[#9C9490]">
                  {cartItem.quantity} in cart —{" "}
                  <Link href="/order" className="text-[#111111] underline underline-offset-2">View</Link>
                </p>
              )}
            </>
          ) : (
            <div className="border border-[#E2D9CE] py-3 text-center text-sm text-[#9C9490]">
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
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <ScrollReveal>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">The Catalog</p>
            <h1 className="text-4xl font-light tracking-tight text-[#111111] sm:text-5xl">Our Fruit</h1>
            <p className="mt-3 text-[#6B6560]">
              Out-of-season items are grayed out — check back when they&apos;re available.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ScrollReveal key={p.id} delay={i * 80}>
              <ProductCard
                product={p}
                stock={inventory[p.id] !== undefined ? inventory[p.id] : null}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200}>
          <div className="mt-12 border border-[#E2D9CE] bg-white p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-[#111111]">Ready to check out?</p>
              <p className="text-sm text-[#6B6560]">Secure payment via Stripe. Receipt sent automatically.</p>
            </div>
            <Link href="/order" className="shrink-0 border border-[#111111] px-8 py-3 text-sm font-medium tracking-wide text-[#111111] transition-colors hover:bg-[#111111] hover:text-white">
              View Cart →
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
