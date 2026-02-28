import Link from "next/link";
import ScrollReveal from "@/components/scroll-reveal";

export default function AboutPage() {
  return (
    <div className="bg-[#F8F5F0]">

      <section className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <ScrollReveal>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Our Story</p>
            <h1 className="max-w-2xl text-5xl font-light leading-tight tracking-tight text-[#111111] sm:text-6xl">
              The Ballow<br />Family
            </h1>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-b border-[#E2D9CE] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <ScrollReveal>
            <p className="max-w-3xl text-2xl font-light leading-relaxed text-[#111111] sm:text-3xl">
              We didn&apos;t set out to start a business. We had fruit trees in
              our yard and more fruit than our family could eat. Instead of letting it rot, 
              we decided to put it to use. Since then, we've donated over $10,000 to a local food bank!
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[280px_1fr]">

            <div className="border-b border-[#E2D9CE] pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-16">
              <ScrollReveal>
                <div className="sticky top-24 space-y-6">
                  <div className="border-l-2 border-[#C8510A] pl-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6B6560]">Founded</p>
                    <p className="text-4xl font-light text-[#111111]">2016</p>
                  </div>
                  <div className="border-l border-[#E2D9CE] pl-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6B6560]">Location</p>
                    <p className="text-sm text-[#111111]">Encinitas, CA</p>
                  </div>
                  <div className="border-l border-[#E2D9CE] pl-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6B6560]">Operation</p>
                    <p className="text-sm text-[#111111]">Family-run, direct sale</p>
                  </div>
                  <div className="border-l border-[#E2D9CE] pl-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6B6560]">Donated</p>
                    <p className="text-sm text-[#111111]">$10k+ to San Diego Food Bank</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="pt-8 lg:pl-16 lg:pt-0">
              <div className="max-w-2xl space-y-12">

                <ScrollReveal>
                  <div className="border-t border-[#E2D9CE] pt-8">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">How It Started</p>
                    <p className="leading-relaxed text-[#6B6560]">
                      Ballow Fruit Co. started in 2016 not as a business plan,
                      but as a realization. We had naval oranges, blood
                      oranges, lemons, limes, pomegranates, avocados — and, fun fact,
                      a few bananas and figs — growing in our yard.
                      In fact, we had so much fruit that our yard was caked with dead 
                      fruit year round with so much going to waste. So, the neighborhood started 
                      getting bags on their doorsteps. Then a local stand. Then word got around.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={60}>
                  <div className="border-t border-[#E2D9CE] pt-8">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Giving Back</p>
                    <p className="leading-relaxed text-[#6B6560]">
                      Giving back has been part of how we operate from the
                      beginning. We&apos;ve run food drives, held lemonade
                      stands, and raised over $10,000 in profit for the San Diego
                      Food Bank. Our family has also volunteered at food bank
                      shelters, spending time packing meals for
                      people who needed them. The fruit and community work
                      have always gone hand in hand.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={120}>
                  <div className="border-t border-[#E2D9CE] pt-8">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Why We Sell Direct</p>
                    <p className="leading-relaxed text-[#6B6560]">
                      Grocery stores want fruit that ships well, looks uniform,
                      and survives weeks in cold storage. That&apos;s not how we
                      grow. We grow for flavor and asymmetry, selling
                      when the fruit is ready, not when a logistics
                      schedule says to. That way you get something that tastes like
                      the fruit should.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={180}>
                  <div className="border-t border-[#E2D9CE] pt-8">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">How Ordering Works</p>
                    <p className="leading-relaxed text-[#6B6560]">
                      Browse the catalog, add what you want to your cart, and
                      check out with Stripe. After payment, you&apos;ll
                      get a receipt by email and we&apos;ll be in touch to arrange
                      pickup or local delivery in the Encinitas area. We keep
                      things simple because we&apos;re a small operation, and we
                      think that&apos;s a pro, not a con.
                    </p>
                  </div>
                </ScrollReveal>

              </div>
            </div>

          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <ScrollReveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-lg font-light text-[#111111]">
                Picked fresh. Sold direct. Tastes like it should.
              </p>
              <Link
                href="/products"
                className="inline-block border border-[#111111] px-8 py-3 text-sm font-medium tracking-wide text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
              >
                Shop the Catalog
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
