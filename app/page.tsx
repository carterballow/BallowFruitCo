import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/scroll-reveal";

const highlights = [
  {
    title: "Coastal Grown",
    body: "Encinitas sits in a rare coastal microclimate — warm days, cool nights, ocean air. It produces some of the best citrus in California.",
  },
  {
    title: "Family Operated",
    body: "One family, one yard. No corporate farming, no distributors. When you order from us, you're ordering from the people who picked it.",
  },
  {
    title: "Peak Season Only",
    body: "We only sell what's ripe right now. That means you always get fruit at its absolute best — not fruit picked weeks early to sit in cold storage.",
  },
];

const products = [
  {
    name: "Naval Oranges",
    tagline: "Bright, sweet, seedless",
    price: "$8",
    unit: "per 5 lb bag",
    image: "/naval-orange.png",
    imagePosition: "center",
  },
  {
    name: "Blood Oranges",
    tagline: "Deep ruby, complex flavor",
    price: "$10",
    unit: "per 5 lb bag",
    image: "/blood-orange.png",
    imagePosition: "center",
  },
  {
    name: "Avocados",
    tagline: "Buttery Hass, tree-ripened",
    price: "$12",
    unit: "per bag of 6",
    image: "/avocado.jpeg",
    imagePosition: "center",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#FFFBF5]">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Decorative soft blobs in background */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-orange-100 opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-[400px] w-[400px] rounded-full bg-amber-100 opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-50 opacity-70 blur-2xl" />

        <div className="relative z-10 max-w-4xl">
          <p className="mb-5 inline-block rounded-full border border-[#F97316]/30 bg-[#FFF7ED] px-4 py-1.5 text-sm font-semibold text-[#F97316]">
            Encinitas, California · Grown in Our Yard
          </p>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-[#1C1917] sm:text-7xl">
            Fresh Fruit,{" "}
            <span className="text-[#F97316]">Direct</span>{" "}
            From Our Yard
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#78716C] sm:text-xl">
            The Ballow family has been growing citrus in Encinitas for generations.
            Order online and get fruit picked at peak ripeness — no grocery store,
            no middleman.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="rounded-md bg-[#F97316] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#EA580C] hover:shadow-md"
            >
              Shop Now
            </Link>
            <Link
              href="/about"
              className="rounded-md border border-[#E0D4C4] bg-white px-8 py-3.5 text-base font-semibold text-[#1C1917] transition-all hover:border-[#F97316] hover:text-[#F97316]"
            >
              Our Story
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-[#78716C]">
            <span className="flex items-center gap-1.5"><span className="text-[#F97316]">✓</span> No middleman</span>
            <span className="flex items-center gap-1.5"><span className="text-[#F97316]">✓</span> Picked at peak ripeness</span>
            <span className="flex items-center gap-1.5"><span className="text-[#F97316]">✓</span> Secure checkout</span>
          </div>
        </div>
      </section>

      {/* ── Products preview ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <ScrollReveal>
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-[#F97316]">Now Available</p>
          <h2 className="mb-3 text-center text-3xl font-extrabold text-[#1C1917] sm:text-4xl">
            What&apos;s In Season
          </h2>
          <p className="mb-14 text-center text-[#78716C]">
            Three products. That&apos;s it. We grow what we&apos;re good at.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {products.map((p, i) => (
            <ScrollReveal key={p.name} delay={i * 100}>
              <Link href="/products" className="group block">
                <div className="card-shadow card-shadow-hover overflow-hidden rounded-2xl border border-[#F0E8DC] bg-white transition-all">
                  <div className="relative h-44 w-full overflow-hidden bg-white">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ objectPosition: p.imagePosition }}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[#1C1917]">{p.name}</h3>
                    <p className="mb-3 text-sm text-[#78716C]">{p.tagline}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-[#F97316]">{p.price}</span>
                      <span className="text-xs text-[#A8A29E]">{p.unit}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-md border border-[#E0D4C4] bg-white px-6 py-3 text-sm font-semibold text-[#1C1917] transition-all hover:border-[#F97316] hover:text-[#F97316]"
            >
              Shop all products →
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Why Ballow ────────────────────────────────────────── */}
      <section className="bg-[#FDF8F2] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="mb-14 text-center text-3xl font-extrabold text-[#1C1917] sm:text-4xl">
              Why Order From Us?
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {highlights.map((h, i) => (
              <ScrollReveal key={h.title} delay={i * 120}>
                <div className="card-shadow rounded-2xl border border-[#F0E8DC] bg-white p-7">
                  <h3 className="mb-2 text-lg font-bold text-[#1C1917]">{h.title}</h3>
                  <p className="text-sm leading-relaxed text-[#78716C]">{h.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story banner ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <ScrollReveal>
          <div className="rounded-3xl bg-[#F97316] px-8 py-16 text-center text-white sm:px-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest opacity-80">The Ballow Family</p>
            <h2 className="mb-5 text-3xl font-extrabold sm:text-4xl">
              Grown with care since day one
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed opacity-90">
              We sell direct because you deserve fruit that actually tastes like fruit —
              not something picked weeks early and shipped across the country.
            </p>
            <Link
              href="/about"
              className="inline-block rounded-md bg-white px-7 py-3 text-sm font-semibold text-[#F97316] transition-all hover:bg-orange-50"
            >
              Read our story →
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-[#F0E8DC] bg-[#FDF8F2] px-6 py-20 text-center">
        <ScrollReveal>
          <h2 className="mb-4 text-3xl font-extrabold text-[#1C1917]">Ready to taste the difference?</h2>
          <p className="mb-8 text-[#78716C]">Secure checkout. Picked fresh. Straight from Encinitas.</p>
          <Link
            href="/products"
            className="inline-block rounded-md bg-[#F97316] px-10 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#EA580C]"
          >
            Shop Now
          </Link>
        </ScrollReveal>
      </section>
    </div>
  );
}
