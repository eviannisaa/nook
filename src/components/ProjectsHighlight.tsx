"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { projects } from "@/app/projects/page";
import { STAR } from "@/components/AboutDoodles";
import { stackSlot } from "@/lib/stackSlot";

const STACK_ICON: Record<string, string> = {
  "Astro.js": "astro",
  Python: "python",
  Tailwind: "tailwindcss",
  TypeScript: "typescript",
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
      const plane = block.querySelector<SVGSVGElement>(".ah-doodle");
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

      if (plane) {
        gsap.to(plane, {
          rotation: "-=3.5",
          transformOrigin: "50% 50%",
          duration: 4.3,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      const draws = block.querySelectorAll<SVGPathElement>(".ah-draw");
      draws.forEach((d) => {
        const len = d.getTotalLength();
        gsap.set(d, { strokeDasharray: len, strokeDashoffset: len });
      });

      const tl = gsap
        .timeline({ paused: true })
        .to(draws, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut", stagger: 0.08 })
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
        <div className="font-caveat text-xl sm:text-2xl font-bold text-foreground tracking-[0.080em]">
          Poject Playground
        </div>
      </div>

      <p className="mb-4 sm:mb-6 lg:max-w-160 text-xs sm:text-sm text-muted font-poppins-sans leading-[1.8] tracking-[0.012em]">
        There’s always something new to explore, so I keep building little things on the side.
        Mostly random ideas, just for fun and to see what I can make.
      </p>

      <div className="relative">
        <svg
          className="ph-star hidden lg:block absolute pointer-events-none top-[50%] mt-14 -right-64 w-4.5 rotate-[9deg]"
          viewBox="0 0 40 40"
          fill="none"
          stroke="var(--blue-color)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
          aria-hidden="true"
        >
          <path className="ah-draw" d={STAR} />
        </svg>

        {/* <svg
          className="ah-doodle hidden lg:block absolute pointer-events-none top-[50%] -mt-24 -right-58 w-28 rotate-[-8deg]"
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M28.0,4.0 C27.9,9.4 28.8,16.5 30.4,21.7 C35.4,19.8 42.3,18.5 47.6,18.2 C42.8,20.9 37.1,25.4 33.3,29.4 C36.9,33.8 40.6,40.3 42.8,45.6 C38.9,41.8 33.2,37.6 28.4,35.2 C24.2,39.0 17.9,43.2 12.7,45.6 C16.6,41.2 20.8,34.7 23.2,29.4 C18.1,26.7 11.8,22.3 7.7,18.3 C13.1,20.2 20.5,21.6 26.2,21.8 C25.9,16.3 26.6,9.2 28.0,4.0"
            stroke="var(--muted-color)"
            strokeWidth="1.5"
            fill="rgba(232,168,56,0.12)"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.45"
          />
          <path
            d="M49.0,6.5 C49.1,8.1 49.6,10.2 50.4,11.7 C51.5,10.9 53.2,10.4 54.6,10.2 C53.3,11.3 52.0,12.9 51.3,14.4 C52.4,15.8 53.3,17.9 53.8,19.6 C52.7,18.1 51.0,16.3 49.4,15.2 C47.9,16.8 45.6,18.6 43.7,19.6 C45.1,18.2 46.5,16.1 47.2,14.3 C45.5,13.4 43.5,11.8 42.1,10.3 C43.9,11.1 46.3,11.7 48.2,11.8 C48.1,10.1 48.4,8.0 49.0,6.5"
            stroke="var(--muted-color)"
            strokeWidth="1.2"
            fill="rgba(224,92,74,0.12)"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.45"
          />
          <path
            d="M6.5,38.0 C6.4,39.8 6.7,42.0 7.3,43.7 C8.8,42.9 10.9,42.3 12.6,42.2 C11.3,43.3 10.0,44.9 9.3,46.4 C10.3,47.7 11.3,49.6 11.8,51.1 C10.7,49.7 8.9,48.1 7.4,47.2 C5.9,48.7 3.6,50.2 1.7,51.1 C3.0,49.9 4.5,48.0 5.2,46.4 C3.6,45.4 1.8,43.8 0.7,42.3 C2.2,43.1 4.4,43.7 6.2,43.8 C5.9,42.0 6.1,39.7 6.5,38.0"
            stroke="var(--muted-color)"
            strokeWidth="1.2"
            fill="rgba(74,143,168,0.12)"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.45"
          />
        </svg> */}

        {/* <svg
          className="ah-doodle hidden lg:block absolute pointer-events-none top-[50%] -mt-24 -right-58 w-28 rotate-[-8deg]"
          viewBox="0 0 100 100"
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
            d="M84.0,18.0 C60.2,28.1 34.3,41.0 12.0,54.0 C22.8,55.1 34.7,57.6 45.0,61.0 C47.6,70.8 52.0,81.2 57.0,90.0 C64.2,66.4 74.0,40.5 84.0,18.0"
          />

          <path
            className="ah-draw"
            strokeWidth="1.3"
            d="M45.0,61.0 C56.7,46.6 70.8,31.1 84.0,18.0"
          />

          <path
            className="ah-draw"
            strokeWidth="1.2"
            d="M6,96 C16,92 24,84 23,75 C22,67 12,67 12,75 C12,84 26,87 37,80 C44,75 49,70 54,66"
          />
          <path className="ph-ray" strokeWidth="1.5" d="M62,30 C66.1,29.0 70.4,27.2 74.0,25.0" />
          <path className="ph-ray" strokeWidth="1.5" d="M60,38 C63.0,36.2 66.6,34.7 70.0,34.0" />
          <path className="ph-ray" strokeWidth="1.5" d="M66,45 C68.8,44.6 71.7,43.5 74.0,42.0" />
          <path
            className="ph-spark"
            strokeWidth="1.4"
            d="M90.0,44.0 C90.1,45.2 90.6,46.4 91.2,47.4 C92.4,47.5 93.6,48.0 94.6,48.6 C93.4,48.7 92.2,49.2 91.2,49.8 C91.1,51.0 90.6,52.2 90.0,53.2 C89.9,52.0 89.4,50.8 88.8,49.8 C87.6,49.7 86.4,49.2 85.4,48.6 C86.6,48.5 87.8,48.0 88.8,47.4 C88.9,46.2 89.4,45.0 90.0,44.0"
          />
          <path
            className="ph-spark"
            strokeWidth="1.3"
            d="M24.0,20.0 C24.1,20.9 24.5,21.8 25.0,22.6 C25.9,22.7 26.8,23.1 27.6,23.6 C26.7,23.7 25.8,24.1 25.0,24.6 C24.9,25.5 24.5,26.4 24.0,27.2 C23.9,26.3 23.5,25.4 23.0,24.6 C22.1,24.5 21.2,24.1 20.4,23.6 C21.3,23.5 22.2,23.1 23.0,22.6 C23.1,21.7 23.5,20.8 24.0,20.0"
          />
        </svg> */}

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
        <div className="lg:max-w-160 sm:pl-2.5 lg:pl-6 font-mono text-xs sm:text-sm leading-[1.95]">
          {TOP_PROJECTS.map((p, i) => {
            const last = i === TOP_PROJECTS.length - 1;
            return (
              <div key={i} className="ah-item block mb-5 last:mb-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-blue">{last ? "└─" : "├─"}</span>
                  <span className="text-foreground">{p.title}</span>
                  <span className="text-blue">/</span>
                  <span className="flex-1 translate-y-[-0.2rem] border-b border-dashed border-border" />
                  <span className="shrink-0 text-muted">{p.year}</span>
                </div>

                <div className="flex gap-2">
                  <span className="shrink-0 text-muted opacity-[0.45]">
                    {last ? "\u00a0\u00a0" : "│\u00a0"}
                  </span>
                  <p className="min-w-0 text-xs sm:text-sm leading-[1.75] text-muted my-2 font-poppins-sans">
                    {p.desc}
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="shrink-0 text-muted opacity-[0.45]">
                    {last ? "\u00a0\u00a0" : "│\u00a0"}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3.5 min-w-0">
                    {Object.entries(STACK_ICON).map(([name, slug], i) => (
                      <span key={name} className={`${stackSlot(i)} items-center gap-1.5`}>
                        <span
                          className="stack-logo [--size:0.7rem] sm:[--size:1.05rem]"
                          aria-hidden="true"
                          style={{
                            ["--ico" as string]: `url(/assets/icons/${slug}.svg)`,
                          }}
                        />
                        <span className="text-muted opacity-[0.85] text-[10px] sm:text-xs">
                          {name}
                        </span>
                      </span>
                    ))}
                    <span className="text-muted text-[10px] sm:text-xs">+3</span>
                  </span>
                </div>

                <div className="flex gap-2 justify-start mt-2">
                  <span className="shrink-0 text-muted opacity-[0.45]">
                    {last ? "\u00a0\u00a0" : "│\u00a0"}
                  </span>
                  <Link href="/projects">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm text-muted font-poppins-sans hover:text-foreground">
                        See more projects
                      </span>
                      <svg width="14" height="9" viewBox="0 0 17 9" fill="none" aria-hidden="true">
                        <path
                          d="M1,4.6 C5,4.1 10,4.9 15.4,4.4"
                          stroke="var(--muted-color)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M12.2,1.6 C13.4,2.8 14.6,3.9 15.8,4.5 C14.6,5.3 13.5,6.4 12.4,7.6"
                          stroke="var(--muted-color)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
