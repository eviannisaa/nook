"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { projects } from "@/app/projects/page";
import { STAR } from "@/components/AboutDoodles";

const STACK_ICON: Record<string, string> = {
  "Astro.js": "astro",
  TypeScript: "typescript",
  Tailwind: "tailwindcss",
  Python: "python",
  PostgreSQL: "postgresql",
  Drizzle: "drizzle",
};

const TOP_PROJECTS = projects.slice(0, 1);

export function ProjectsHighlight() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const block = rootRef.current;
      if (!block) return;

      const rays = block.querySelectorAll<SVGPathElement>(".ph-ray");
      const sparks = block.querySelectorAll<SVGPathElement>(".ph-spark");
      const glow = block.querySelectorAll<SVGPathElement>(".ph-glow");
      const bulb = block.querySelector<SVGSVGElement>(".ah-doodle");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.set(rays, { opacity: 0.25 });
      gsap.to(rays, {
        opacity: 1,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.13, from: "center" },
      });

      gsap.to(glow, {
        opacity: 0.4,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.set(sparks, { transformOrigin: "50% 50%" });
      gsap.to(sparks, {
        scale: 0.45,
        opacity: 0.2,
        duration: 1.3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.6, from: "random" },
      });

      if (bulb) {
        gsap.to(bulb, {
          rotation: "-=3.5",
          transformOrigin: "50% 15%",
          duration: 4.3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      const items = block.querySelectorAll(".ah-item");
      const draws = block.querySelectorAll<SVGPathElement>(".ah-draw");
      gsap.set(items, { autoAlpha: 0, y: 10 });
      draws.forEach((d) => {
        const len = d.getTotalLength();
        gsap.set(d, { strokeDasharray: len, strokeDashoffset: len });
      });

      const tl = gsap
        .timeline({ paused: true })
        .to(items, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.1 })
        .to(
          draws,
          { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut", stagger: 0.08 },
          0.15,
        )
        .add(() => {
          gsap.to(block.querySelector(".ah-doodle"), {
            y: -6,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
          gsap.to(block.querySelector(".ph-dots"), {
            y: -5,
            duration: 3.1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });

          gsap.to(block.querySelector(".ph-star"), {
            y: -4,
            duration: 3.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
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
      io.observe(block);

      return () => io.disconnect();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative lg:max-w-160">
      <svg
        className="ph-dots absolute pointer-events-none"
        style={{ top: "-10rem", left: "5rem", width: 26 }}
        viewBox="0 0 40 20"
        fill="none"
        stroke="var(--muted-color)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
        aria-hidden="true"
      >
        <path className="ah-draw" d="M6,10 L8,10" />
        <path className="ah-draw" d="M18,14 L20,14" />
        <path className="ah-draw" d="M30,10 L32,10" />
      </svg>

      <div className="flex gap-2.5 items-center mb-2">
        <div className="font-mono text-[0.72rem] text-muted opacity-[0.65]">// 03</div>
        <div className="font-caveat text-2xl font-bold text-foreground tracking-[0.080em]">
          Poject Playground
        </div>
      </div>

      <p className="mb-5 lg:max-w-160 text-sm text-muted font-poppins-sans leading-[1.8] tracking-[0.012em]">
        There’s always something new to explore, so I keep building little things on the side.
        Mostly random ideas, just for fun and to see what I can make.
      </p>

      <div className="relative">
        <svg
          className="ph-star hidden lg:block absolute pointer-events-none top-[50%] mt-14 -right-64 w-4.5 rotate-[9deg]"
          viewBox="0 0 40 40"
          fill="none"
          stroke="var(--muted-color)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
          aria-hidden="true"
        >
          <path className="ah-draw" d={STAR} />
        </svg>

        {/* Lampu: w-32 -> w-28 (128px -> 112px) dan strokeWidth 1.7 -> 1.9.
            Garisnya dinaikkan karena kotaknya mengecil — tanpa itu tintanya
            ikut menipis 12% dan kesan spidolnya hilang justru saat ukurannya
            paling butuh ketegasan. */}
        <svg
          className="ah-doodle hidden lg:block absolute pointer-events-none top-[50%] -mt-30 -right-58 w-28 rotate-[-8deg]"
          viewBox="0 0 100 128"
          fill="none"
          stroke="var(--muted-color)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
          aria-hidden="true"
        >
          <path
            className="ah-draw"
            d="M38,92 C37.4,86 31.6,79.4 26.4,71.4 C21,64 18.6,57.2 19.2,49 C19.6,32 33.2,17.6 50,18 C67.2,18.4 81.4,32.2 80.8,49 C80.4,57.2 79.2,64.4 73.8,71.6 C68.4,79.4 62.6,86 62,92 Z"
          />
          <path className="ah-draw" strokeWidth="1.3" d="M31,42 C31,33 36,26 43,23" />
          <path
            className="ah-draw"
            strokeWidth="1.5"
            d="M38.0,92.0 C45.7,91.0 54.3,91.0 62.0,92.0 C60.6,97.7 60.2,104.2 61.0,110.0 C61.0,113.0 58.2,115.4 55.0,115.0 C51.8,114.0 48.2,114.0 45.0,115.0 C41.8,114.6 39.0,113.0 39.0,110.0 C39.8,104.2 39.4,97.7 38.0,92.0"
          />
          <path className="ah-draw" strokeWidth="1.2" d="M38.6,97 C45,99 55,99 61.4,97" />
          <path className="ah-draw" strokeWidth="1.2" d="M38.9,102 C45,104 55,104 61.1,102" />
          <path className="ah-draw" strokeWidth="1.2" d="M39.3,107 C45,109 55,109 60.7,107" />
          <path className="ah-draw" strokeWidth="1.3" d="M45,115 C45,121 55,121 55,115" />
          <path
            className="ah-draw"
            strokeWidth="1.3"
            d="M45.0,91.0 C45.6,83.6 45.2,75.3 44.0,68.0"
          />
          <path
            className="ah-draw"
            strokeWidth="1.3"
            d="M55.0,91.0 C54.4,83.6 54.8,75.3 56.0,68.0"
          />
          <path
            className="ah-draw ph-glow"
            strokeWidth="1.5"
            stroke="var(--amber-color)"
            d="M44,68 C46,60 48,72 50,62 C52,72 54,60 56,68"
          />
          <path
            className="ph-spark"
            strokeWidth="1.4"
            d="M88.0,20.0 C88.1,21.4 88.6,22.8 89.3,24.0 C90.6,24.2 91.9,24.7 93.0,25.4 C91.7,25.5 90.4,26.0 89.3,26.7 C89.2,28.0 88.7,29.4 88.0,30.6 C87.9,29.3 87.4,27.9 86.7,26.7 C85.4,26.6 84.1,26.1 83.0,25.4 C84.3,25.2 85.6,24.7 86.7,24.0 C86.8,22.6 87.3,21.2 88.0,20.0"
          />
          <path
            className="ph-spark"
            strokeWidth="1.3"
            d="M13.0,70.0 C13.1,70.9 13.5,71.8 14.0,72.6 C14.9,72.7 15.8,73.1 16.6,73.6 C15.7,73.7 14.8,74.1 14.0,74.6 C13.9,75.5 13.5,76.4 13.0,77.2 C12.9,76.3 12.5,75.4 12.0,74.6 C11.1,74.5 10.2,74.1 9.4,73.6 C10.3,73.5 11.2,73.1 12.0,72.6 C12.1,71.7 12.5,70.8 13.0,70.0"
          />
          <path className="ph-ray" strokeWidth="1.6" d="M50,10 C50.5,7.4 49.8,5 49.4,2.4" />
          <path className="ph-ray" strokeWidth="1.6" d="M27,24 C25,22.2 22.8,20 20.4,17.2" />
          <path className="ph-ray" strokeWidth="1.6" d="M73,24 C75.4,22.4 77.2,19.8 79.6,17.4" />
          <path className="ph-ray" strokeWidth="1.6" d="M14,49 C11.2,49.6 8.4,48.8 5.6,49.4" />
          <path className="ph-ray" strokeWidth="1.6" d="M86,49 C88.8,48.4 91.4,49.2 94.4,48.6" />
        </svg>
        <div className="lg:max-w-160 lg:pl-6 font-mono text-sm leading-[1.95]">
          {TOP_PROJECTS.map((p, i) => {
            const last = i === TOP_PROJECTS.length - 1;
            return (
              <div key={i} className="ah-item block mb-5 last:mb-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-amber">{last ? "└─" : "├─"}</span>
                  <span className="text-foreground">{p.title}</span>
                  <span className="text-amber">/</span>
                  <span className="flex-1 translate-y-[-0.2rem] border-b border-dashed border-border" />
                  <span className="shrink-0 text-muted">{p.year}</span>
                </div>

                <div className="flex gap-2">
                  <span className="shrink-0 text-muted opacity-[0.45]">
                    {last ? "\u00a0\u00a0" : "│\u00a0"}
                  </span>
                  <p className="min-w-0 text-sm leading-[1.75] text-muted my-2 font-poppins-sans">
                    {p.desc}
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="shrink-0 text-muted opacity-[0.45]">
                    {last ? "\u00a0\u00a0" : "│\u00a0"}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3.5 min-w-0">
                    {Object.entries(STACK_ICON).map(([name, slug]) => (
                      <span key={name} className="flex items-center gap-1.5">
                        <span
                          className="stack-logo"
                          aria-hidden="true"
                          style={{
                            ["--ico" as string]: `url(/assets/icons/${slug}.svg)`,
                            ["--size" as string]: "0.86rem",
                          }}
                        />
                        <span className="text-muted opacity-[0.85] text-xs">{name}</span>
                      </span>
                    ))}
                    <span className="text-amber text-xs">+3</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Link href="/projects">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-sm text-muted font-poppins-sans">See more projects</span>
            <svg width="14" height="9" viewBox="0 0 17 9" fill="none" aria-hidden="true">
              <path
                d="M1,4.6 C5,4.1 10,4.9 15.4,4.4"
                stroke="var(--amber-color)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12.2,1.6 C13.4,2.8 14.6,3.9 15.8,4.5 C14.6,5.3 13.5,6.4 12.4,7.6"
                stroke="var(--amber-color)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
    </section>
  );
}
