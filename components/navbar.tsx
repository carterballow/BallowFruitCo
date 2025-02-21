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

  // Check auth state on mount and whenever it changes (login/logout).
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Get the current session right away
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Subscribe to auth changes so the navbar updates instantly after login/logout
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

  // User's initials for the avatar button (e.g. "CB" from "carter@ballow.com")
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#F0E8DC] bg-[#FFFBF5]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Full branded logo with text */}
        <Link href="/" className="shrink-0">
          <Image
            src="/ballowfruitco.png"
            alt="Ballow Fruit Co."
            width={180}
            height={56}
            className="h-11 w-auto"
            style={{ mixBlendMode: "multiply" }}
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-[#1C1917] transition-colors hover:text-[#F97316]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side: cart + auth */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Cart icon with live item count badge */}
          <Link
            href="/order"
            className="relative flex items-center justify-center rounded-full p-2 text-[#1C1917] transition-colors hover:text-[#F97316]"
            aria-label="Cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            // Logged in: show user initials button → dashboard, and a logout link
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316] text-xs font-bold text-white hover:bg-[#EA580C]"
                title={user.email}
              >
                {initials}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-[#78716C] hover:text-[#F97316]"
              >
                Log out
              </button>
            </div>
          ) : (
            // Logged out: show Login button + Order Now CTA
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-[#1C1917] transition-colors hover:text-[#F97316]"
              >
                Login
              </Link>
              <Link
                href="/order"
                className="rounded-md bg-[#F97316] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#EA580C]"
              >
                Order Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile: cart icon + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/order" className="relative p-2 text-[#1C1917]">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-6 bg-[#1C1917] transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-[#1C1917] transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-[#1C1917] transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-[#F0E8DC] bg-[#FFFBF5] px-6 pb-5 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block text-sm font-medium text-[#1C1917] hover:text-[#F97316]" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-[#F0E8DC] pt-4">
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" className="block text-sm font-medium text-[#1C1917] hover:text-[#F97316]" onClick={() => setMenuOpen(false)}>
                    Dashboard ({user.email})
                  </Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-left text-sm font-medium text-[#78716C] hover:text-[#F97316]">
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/login" className="block text-sm font-medium text-[#1C1917] hover:text-[#F97316]" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/order" className="mt-1 block rounded-md bg-[#F97316] px-5 py-2.5 text-center text-sm font-semibold text-white" onClick={() => setMenuOpen(false)}>
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
