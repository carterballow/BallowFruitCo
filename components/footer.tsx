import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[#F0E8DC] bg-[#FDF8F2] px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">

          {/* Brand */}
          <div>
            <div className="mb-3">
              <Image
                src="/ballowfruitco.png"
                alt="Ballow Fruit Co."
                width={140}
                height={44}
                className="h-9 w-auto"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>
            <p className="text-sm leading-relaxed text-[#78716C]">
              Home-grown citrus and fruit from our trees in Encinitas,
              California. Picked at peak ripeness, sold direct to you.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F97316]">
              Navigate
            </h3>
            <ul className="space-y-2.5 text-sm text-[#78716C]">
              {[
                ["Shop", "/products"],
                ["Our Story", "/about"],
                ["Recipes", "/recipes"],
                ["Contact", "/contact"],
                ["Place Order", "/order"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-[#F97316]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F97316]">
              Get In Touch
            </h3>
            <ul className="space-y-2.5 text-sm text-[#78716C]">
              <li>Encinitas, California</li>
              <li>
                <a href="mailto:cartsballow@gmail.com" className="transition-colors hover:text-[#F97316]">
                  cartsballow@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#F0E8DC] pt-6 text-center text-xs text-[#A8A29E]">
          © {new Date().getFullYear()} Ballow Fruit Company · Encinitas, CA · All rights reserved.
        </div>
      </div>
    </footer>
  );
}
