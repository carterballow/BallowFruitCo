import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[#E2D9CE] bg-[#F8F5F0]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">

          <div>
            <div className="mb-4">
              <Image
                src="/ballowfruitco.png"
                alt="Ballow Fruit Co."
                width={130}
                height={40}
                className="h-8 w-auto"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>
            <p className="text-sm leading-relaxed text-[#6B6560]">
              Home-grown citrus and fruit from our trees in Encinitas,
              California. Picked at peak ripeness, sold direct to you.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#9C9490]">
              Navigate
            </h3>
            <ul className="space-y-3 text-sm text-[#6B6560]">
              {[
                ["Shop", "/products"],
                ["Our Story", "/about"],
                ["Recipes", "/recipes"],
                ["Planner", "/planner"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-[#111111]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#9C9490]">
              Get In Touch
            </h3>
            <ul className="space-y-3 text-sm text-[#6B6560]">
              <li>Encinitas, California</li>
              <li>
                <a href="mailto:cartsballow@gmail.com" className="transition-colors hover:text-[#111111]">
                  cartsballow@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-16 border-t border-[#E2D9CE] pt-6 text-xs text-[#9C9490]">
          © {new Date().getFullYear()} Ballow Fruit Company · Encinitas, CA
        </div>
      </div>
    </footer>
  );
}
