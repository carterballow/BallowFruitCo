"use client";

/**
 * ScrollReveal — makes children fade up into view as you scroll.
 *
 * Plain-English: This component uses the browser's built-in
 * IntersectionObserver API to watch whether an element is visible
 * in the viewport. When it enters view, we add a CSS class that
 * triggers the fade-up animation defined in globals.css.
 *
 * Usage:
 *   <ScrollReveal delay={200}>
 *     <p>This text fades in when scrolled to</p>
 *   </ScrollReveal>
 */

import { useRef, useEffect, ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;   // milliseconds before the animation starts
  className?: string;
}

export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // IntersectionObserver fires whenever an element enters or exits the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("visible");
          observer.unobserve(el); // only animate once
        }
      },
      { threshold: 0.12 } // trigger when 12% of element is visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
