import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/scroll-reveal";

const products = [
  {
    name: "Naval Oranges",
    tagline: "Bright, sweet, seedless",
    price: "$8",
    unit: "per 5 lb bag",
    image: "/naval-orange.png",
  },
  {
    name: "Blood Oranges",
    tagline: "Deep ruby, complex flavor",
    price: "$10",
    unit: "per 5 lb bag",
    image: "/bloodorange.png",
  },
  {
    name: "Avocados",
    tagline: "Buttery Hass, tree-ripened",
    price: "$12",
    unit: "per bag of 6",
    image: "/avocado.png",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#F8F5F0]">

      <section className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-7xl px-6 py-28 sm:py-40">
          <div className="max-w-3xl">
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">
              Encinitas, California — Est. 2016
            </p>
            <h1 className="mb-8 text-5xl font-light leading-[1.05] tracking-tight text-[#111111] sm:text-7xl lg:text-8xl">
              Fruit grown in our yard,<br />
              <em className="not-italic text-[#C8510A]">sold direct to you.</em>
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-[#6B6560]">
              The Ballow family has been growing citrus and avocados in Encinitas
              since 2016. No distributors, no cold storage, no middleman.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="bg-[#111111] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#C8510A]"
              >
                Shop Now
              </Link>
              <Link
                href="/about"
                className="border border-[#C8B9A8] px-8 py-3.5 text-sm font-medium tracking-wide text-[#111111] transition-colors hover:border-[#111111]"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <ScrollReveal>
            <div className="mb-12 flex items-baseline justify-between">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Now Available</p>
                <h2 className="text-3xl font-light tracking-tight text-[#111111]">What&apos;s in Season</h2>
              </div>
              <Link
                href="/products"
                className="hidden text-sm text-[#6B6560] underline underline-offset-4 hover:text-[#111111] sm:block"
              >
                View all →
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-0 border border-[#E2D9CE] sm:grid-cols-3">
            {products.map((p, i) => (
              <ScrollReveal key={p.name} delay={i * 80}>
                <Link href="/products" className="group block border-b border-[#E2D9CE] sm:border-b-0 sm:border-r last:border-r-0">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-103"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="border-t border-[#E2D9CE] bg-white p-5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="font-medium text-[#111111]">{p.name}</p>
                        <p className="text-sm text-[#6B6560]">{p.tagline}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#111111]">{p.price}</p>
                        <p className="text-xs text-[#9C9490]">{p.unit}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            <ScrollReveal>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Why Order From Us</p>
              <h2 className="text-3xl font-light leading-snug tracking-tight text-[#111111] sm:text-4xl">
                Grocery stores want fruit that ships well.<br />
                We grow for flavor.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="space-y-8 pt-2">
                {[
                  {
                    label: "Picked at peak ripeness",
                    body: "Every order leaves our trees at the right moment — not weeks early to survive cold storage and shipping."
                  },
                  {
                    label: "One family, one yard",
                    body: "You're ordering from the people who grew it. No corporate farming, no distributors, no markup chain."
                  },
                  {
                    label: "Coastal microclimate",
                    body: "Encinitas has warm days, cool nights, and ocean air — conditions that concentrate flavor in a way that inland growing can't replicate."
                  }
                ].map((item) => (
                  <div key={item.label} className="border-t border-[#E2D9CE] pt-6">
                    <p className="mb-2 text-sm font-semibold text-[#111111]">{item.label}</p>
                    <p className="text-sm leading-relaxed text-[#6B6560]">{item.body}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-b border-[#E2D9CE] bg-[#111111]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">The Ballow Family</p>
              <p className="mb-8 text-2xl font-light leading-relaxed text-white sm:text-3xl">
                &ldquo;We had more fruit growing in our yard than we knew what to do with.
                Instead of letting it go to waste, we started sharing it.&rdquo;
              </p>
              <Link
                href="/about"
                className="border border-white/30 px-7 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-[#111111]"
              >
                Read our story →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <ScrollReveal>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Ready to Order</p>
            <h2 className="mb-6 text-3xl font-light tracking-tight text-[#111111]">
              Picked fresh. Sold direct.
            </h2>
            <Link
              href="/products"
              className="inline-block bg-[#111111] px-10 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#C8510A]"
            >
              Shop Now
            </Link>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
