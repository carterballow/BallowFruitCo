"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const links = [
  { href: "/products", label: "Shop" },
  { href: "/planner", label: "Planner" },
  { href: "/about", label: "Our Story" },
  { href: "/recipes", label: "Recipes" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E2D9CE] bg-[#F8F5F0]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <Link href="/" className="shrink-0">
          <Image
            src="/ballowfruitco.png"
            alt="Ballow Fruit Co."
            width={160}
            height={50}
            className="h-9 w-auto"
            style={{ mixBlendMode: "multiply" }}
            priority
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-[#6B6560] transition-colors hover:text-[#111111]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/order" className="relative p-1 text-[#6B6560] transition-colors hover:text-[#111111]" aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center bg-[#C8510A] text-[9px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex h-7 w-7 items-center justify-center bg-[#111111] text-[10px] font-bold text-white hover:bg-[#C8510A] transition-colors"
                title={user.email}
              >
                {initials}
              </Link>
              <button onClick={handleLogout} className="text-sm text-[#9C9490] hover:text-[#111111]">
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-[#6B6560] hover:text-[#111111]">
                Login
              </Link>
              <Link href="/order" className="bg-[#111111] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C8510A]">
                Order Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/order" className="relative p-1 text-[#6B6560]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center bg-[#C8510A] text-[9px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="flex flex-col gap-1.5 p-1">
            <span className={`block h-px w-5 bg-[#111111] transition-transform ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-px w-5 bg-[#111111] transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-5 bg-[#111111] transition-transform ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[#E2D9CE] bg-[#F8F5F0] px-6 pb-6 md:hidden">
          <ul className="flex flex-col gap-4 pt-5">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block text-sm text-[#6B6560] hover:text-[#111111]" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-[#E2D9CE] pt-4">
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" className="text-sm text-[#111111]" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-left text-sm text-[#9C9490]">
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/login" className="text-sm text-[#6B6560]" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/order" className="bg-[#111111] px-5 py-2.5 text-center text-sm font-medium text-white" onClick={() => setMenuOpen(false)}>
                    Order Now
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
