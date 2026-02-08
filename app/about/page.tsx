import Link from "next/link";
import ScrollReveal from "@/components/scroll-reveal";

const values = [
  { label: "Founded", sub: "Encinitas, CA · 2016" },
  { label: "Family Operated", sub: "One family, one yard" },
  { label: "No Middleman", sub: "Direct from us to you" },
];

const sections = [
  {
    title: "How It Started",
    color: "#F97316",
    body: "Ballow Fruit Co. started in 2016 — not as a business plan, but as a simple realization: we had more fruit growing in our yard than we knew what to do with. Instead of letting it go to waste, we started sharing it with the neighborhood, then at local stands, and eventually built it into something real.",
  },
  {
    title: "Giving Back Along the Way",
    color: "#CA8A04",
    body: "From the beginning, giving back has been part of how we operate. We've run food drives, held lemonade stands, and raised over $10,000 in profit for the San Diego Food Bank. Our family has also volunteered at local homeless shelters — spending time in the kitchen making meals for people who needed them. The fruit business and the community work have always gone hand in hand.",
  },
  {
    title: "Why We Sell Direct",
    color: "#DC2626",
    body: "Grocery stores want fruit that ships well, looks uniform, and survives weeks in cold storage. We don't grow for that. We grow for flavor. Selling direct means we pick at peak ripeness and you get fruit that actually tastes like fruit — not something that was picked green and gassed to ripen in a warehouse.",
  },
  {
    title: "How Ordering Works",
    color: "#F97316",
    body: "Browse our catalog, add what you want to your cart, and check out securely with Stripe. After payment, you'll get a receipt by email and we'll reach out to arrange pickup or local delivery in the Encinitas area. We keep things simple because we're a small operation — and we think that's a feature, not a bug.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] px-6 py-16">
      <div className="mx-auto max-w-3xl">

        <ScrollReveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#F97316]">Our Story</p>
          <h1 className="mb-3 text-4xl font-extrabold text-[#1C1917] sm:text-5xl">The Ballow Family</h1>
          <p className="mb-14 text-lg text-[#78716C]">
            A family yard in Encinitas, California — started from fruit we were already growing in our own trees, built into something we're proud of.
          </p>
        </ScrollReveal>

        <div className="space-y-6">
          {sections.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 80}>
              <div className="rounded-2xl border border-[#F0E8DC] bg-white p-7 card-shadow">
                <h2 className="mb-3 text-xl font-bold" style={{ color: s.color }}>{s.title}</h2>
                <p className="leading-relaxed text-[#78716C]">{s.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {values.map((v, i) => (
            <ScrollReveal key={v.label} delay={i * 100}>
              <div className="rounded-2xl border border-[#F0E8DC] bg-white p-6 text-center card-shadow">
                <p className="font-bold text-[#1C1917]">{v.label}</p>
                <p className="mt-1 text-sm text-[#78716C]">{v.sub}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200}>
          <div className="mt-14 rounded-2xl bg-[#F97316] px-8 py-10 text-center text-white">
            <h2 className="mb-3 text-2xl font-bold">Try it for yourself</h2>
            <p className="mb-6 text-sm opacity-90">Picked fresh. Sold direct. Tastes like it should.</p>
            <Link href="/products" className="inline-block rounded-md bg-white px-7 py-3 text-sm font-semibold text-[#F97316] hover:bg-orange-50">
              Shop Now
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
