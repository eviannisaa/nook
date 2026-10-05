"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
const ACCENT = "var(--teal-color)";

type Mark = { slug: string; name: string; tilt: number; size: number };

const STACK: Mark[] = [
  { slug: "nextdotjs", name: "Next.js", tilt: -7, size: 1.72 },
  { slug: "vuedotjs", name: "Vue.js", tilt: 5, size: 1.58 },
  { slug: "typescript", name: "TypeScript", tilt: -3, size: 1.66 },
  { slug: "tailwindcss", name: "Tailwind CSS", tilt: 8, size: 1.75 },
  { slug: "go", name: "Go", tilt: -5, size: 1.6 },
  { slug: "express", name: "Express.js", tilt: 3, size: 1.7 },
  { slug: "postgresql", name: "PostgreSQL", tilt: -8, size: 1.63 },
  { slug: "mongodb", name: "MongoDB", tilt: 4, size: 1.74 },
  { slug: "prisma", name: "Prisma", tilt: -2, size: 1.57 },
  { slug: "docker", name: "Docker", tilt: 6, size: 1.68 },
  { slug: "nginx", name: "Nginx", tilt: -6, size: 1.61 },
  { slug: "git", name: "Git", tilt: 2, size: 1.71 },
];

export function StackStrip() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const items = self.selector!(".stack-logo");

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.set(items, { autoAlpha: 0, y: 8 });

      const tl = gsap.timeline({ paused: true }).to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.34,
        ease: "power2.out",
        stagger: 0.045,
      });

      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            tl.play();
            io.disconnect();
          }
        },
        { threshold: 0 },
      );
      if (rootRef.current) io.observe(rootRef.current);

      return () => io.disconnect();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <div className="mb-4">
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem",
            color: "var(--muted-color)",
            lineHeight: 1,
          }}
        >
          <span style={{ color: ACCENT }}>$ </span>ls ~/stack/most-used
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-4"
        style={{ ["--accent" as string]: ACCENT }}
      >
        {STACK.map((m) => (
          <span
            key={m.slug}
            className="stack-mark"
            style={{ ["--tilt" as string]: `${m.tilt}deg` }}
          >
            <span
              className="stack-logo"
              role="img"
              aria-label={m.name}
              title={m.name}
              style={{
                ["--ico" as string]: `url(/assets/icons/${m.slug}.svg)`,
                ["--size" as string]: `${m.size}rem`,
              }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
