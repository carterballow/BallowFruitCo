import Link from "next/link";
import ScrollReveal from "@/components/scroll-reveal";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#F97316]">
            Reach Out
          </p>
          <h1 className="mb-3 text-4xl font-extrabold text-[#1C1917] sm:text-5xl">
            Contact Us
          </h1>
          <p className="mb-14 text-lg text-[#78716C]">
            Have a question about availability, quantities, or delivery? We
            reply to every message personally.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            {
              label: "Location",
              value: "Encinitas, California",
              sub: "San Diego County",
            },
            {
              label: "Email",
              value: "cartsballow@gmail.com",
              sub: "We reply within 24 hours",
              href: "mailto:cartsballow@gmail.com",
            },
            {
              label: "Order Hours",
              value: "Mon – Sat, 8am – 6pm",
              sub: "Pacific Time",
            },
            {
              label: "Pickup / Delivery",
              value: "Local Encinitas Area",
              sub: "Arrange at time of order",
            },
          ].map((item) => (
            <ScrollReveal key={item.label}>
              <div className="rounded-2xl border border-[#F0E8DC] bg-white p-6 card-shadow">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#F97316]">
                  {item.label}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="block font-semibold text-[#1C1917] transition-colors hover:text-[#F97316]"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="font-semibold text-[#1C1917]">{item.value}</p>
                )}
                <p className="mt-1 text-sm text-[#A8A29E]">{item.sub}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200}>
          <div className="mt-10 rounded-2xl border border-[#F0E8DC] bg-white p-8 text-center card-shadow">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#F97316]">Ready to order?</p>
            <h2 className="mb-3 text-2xl font-bold text-[#1C1917]">Skip the back-and-forth</h2>
            <p className="mb-6 text-sm text-[#78716C]">
              Browse our catalog and check out directly — no need to email first.
            </p>
            <Link
              href="/order"
              className="inline-block rounded-md bg-[#F97316] px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-[#EA580C]"
            >
              Place an Order
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
