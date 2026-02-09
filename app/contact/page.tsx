import Link from "next/link";
import ScrollReveal from "@/components/scroll-reveal";

export default function ContactPage() {
  return (
    <div className="bg-[#F8F5F0]">
      <div className="border-b border-[#E2D9CE]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <ScrollReveal>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#C8510A]">Reach Out</p>
            <h1 className="text-4xl font-light tracking-tight text-[#111111] sm:text-5xl">Contact</h1>
            <p className="mt-3 text-[#6B6560]">
              Questions about availability, quantities, or delivery — we reply to every message personally.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="divide-y divide-[#E2D9CE] border border-[#E2D9CE] bg-white">
          {[
            { label: "Location", value: "Encinitas, California", sub: "San Diego County" },
            { label: "Email", value: "cartsballow@gmail.com", sub: "We reply within 24 hours", href: "mailto:cartsballow@gmail.com" },
            { label: "Hours", value: "Mon – Sat, 8am – 6pm", sub: "Pacific Time" },
            { label: "Pickup & Delivery", value: "Local Encinitas Area", sub: "Arranged at time of order" },
          ].map((item) => (
            <ScrollReveal key={item.label}>
              <div className="flex items-start gap-8 px-6 py-5">
                <p className="w-28 shrink-0 pt-0.5 text-xs font-medium uppercase tracking-[0.15em] text-[#9C9490]">
                  {item.label}
                </p>
                <div>
                  {item.href ? (
                    <a href={item.href} className="font-medium text-[#111111] transition-colors hover:text-[#C8510A]">
                      {item.value}
                    </a>
                  ) : (
                    <p className="font-medium text-[#111111]">{item.value}</p>
                  )}
                  <p className="mt-0.5 text-sm text-[#9C9490]">{item.sub}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={150}>
          <div className="mt-6 flex flex-col gap-4 border border-[#E2D9CE] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-[#111111]">Ready to order?</p>
              <p className="text-sm text-[#6B6560]">Browse the catalog and check out directly — no need to email first.</p>
            </div>
            <Link
              href="/order"
              className="shrink-0 border border-[#111111] px-7 py-3 text-sm font-medium tracking-wide text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
            >
              Place an Order
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
