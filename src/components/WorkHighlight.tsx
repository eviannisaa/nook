"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { timeline } from "@/app/experience/page";
import { stackSlot } from "@/lib/stackSlot";
import { useTheme } from "@/components/ThemeProvider";

const WORK_STACK: [slug: string, name: string][] = [
  ["react", "React.js"],
  ["go", "Go"],
  ["vuedotjs", "Vue.js"],
  ["tailwindcss", "Tailwind"],
  ["reactquery", "TanStack Query"],
];

const TOP_WORK = timeline.slice(0, 1);

export function WorkHighlight() {
  const { theme } = useTheme();

  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const block = rootRef.current;
      if (!block) return;

      const code = block.querySelectorAll<SVGPathElement>(".wh-code");

      code.forEach((c) => {
        const len = c.getTotalLength();
        gsap.set(c, { strokeDasharray: len, strokeDashoffset: len });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(code, { strokeDashoffset: 0 });
        return;
      }

      gsap
        .timeline({ repeat: -1, delay: 0.8 })
        .to(code, { strokeDashoffset: 0, duration: 0.4, ease: "none", stagger: 0.22 })
        .to(
          code,
          {
            strokeDashoffset: (_i, t) => (t as SVGPathElement).getTotalLength(),
            duration: 0.25,
            ease: "none",
            stagger: 0.07,
          },
          "+=1.2",
        );

      const draws = block.querySelectorAll<SVGPathElement>(".ah-draw");
      draws.forEach((d) => {
        const len = d.getTotalLength();
        gsap.set(d, { strokeDasharray: len, strokeDashoffset: len });
      });

      const tl = gsap
        .timeline({ paused: true })
        .to(draws, {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: "power1.inOut",
          stagger: 0.08,
          onComplete: () => gsap.set(draws, { clearProps: "strokeDasharray,strokeDashoffset" }),
        })
        .add(() => {
          gsap.to(block.querySelectorAll(".ah-doodle"), {
            y: -6,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: { each: 0.35, from: "random" },
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
    <section ref={rootRef} className="relative lg:ml-auto lg:max-w-160">
      <svg
        className="ah-doodle hidden lg:block absolute pointer-events-none"
        style={{ top: "3.4rem", left: "-6rem", width: 30 }}
        viewBox="0 0 40 20"
        fill="none"
        stroke="var(--purple-color)"
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

      <svg
        className="ah-doodle hidden lg:block absolute pointer-events-none"
        style={{
          top: "9.5rem",
          left: "-15.2rem",
          width: 150,
          transform: "rotate(-6deg)",
        }}
        viewBox="0 0 116 96"
        fill="none"
        stroke="var(--muted-color)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
        aria-hidden="true"
      >
        <path
          className="ah-draw"
          d="M16.0,68.0 C30.5,59.3 46.1,51.8 62.0,46.0 C75.9,53.9 90.9,60.7 106.0,66.0 C91.5,74.6 75.8,82.1 60.0,88.0 C46.0,80.2 31.1,73.4 16.0,68.0"
        />
        <path
          className="ah-draw"
          d="M16.0,68.0 C30.5,59.3 46.1,51.8 62.0,46.0 C61.5,33.2 59.5,20.3 56.0,8.0 C41.4,16.5 25.8,24.0 10.0,30.0 C10.8,42.7 12.8,55.6 16.0,68.0"
        />
        <path
          className="ah-draw"
          strokeWidth="1.3"
          d="M19.7,60.9 C32.4,56.1 45.0,50.0 56.7,43.2 C54.3,34.1 52.8,24.5 52.3,15.1 C39.7,20.0 27.1,26.1 15.3,32.8 C17.6,41.9 19.1,51.5 19.7,60.9"
        />
        <path className="ah-draw" strokeWidth="1.2" d="M9.7,28.0 C25.4,21.9 41.1,14.4 55.7,6.0" />
        <path
          className="ah-draw"
          strokeWidth="1.2"
          d="M65.6,77.1 C69.4,74.4 73.8,72.4 78.3,71.1 C80.2,72.7 82.4,73.7 84.9,74.1 C81.1,76.8 76.7,78.8 72.2,80.1 C70.3,78.5 68.1,77.5 65.6,77.1"
        />
        <path
          className="ah-draw"
          strokeWidth="1.4"
          strokeDasharray="4 2.2"
          d="M34.6,71.4 C46.6,66.7 58.6,61.0 69.8,54.6"
        />
        <path
          className="ah-draw"
          strokeWidth="1.4"
          strokeDasharray="4 2.2"
          d="M41.2,74.4 C52.4,68.0 64.4,62.3 76.4,57.6"
        />
        <path
          className="ah-draw"
          strokeWidth="1.4"
          strokeDasharray="4 2.2"
          d="M47.8,77.4 C59.8,72.7 71.8,67.0 83.0,60.6"
        />
        <path
          className="ah-draw"
          strokeWidth="1.4"
          strokeDasharray="4 2.2"
          d="M54.4,80.4 C65.6,74.0 77.6,68.3 89.6,63.6"
        />
        <path className="wh-code" strokeWidth="2.1" d="M21.5,54.0 C29.5,49.3 38.1,45.2 46.8,41.9" />
        <path
          className="wh-code"
          strokeWidth="2.1"
          stroke="var(--green-color)"
          d="M20.6,47.8 C31.0,43.7 41.4,38.7 51.2,33.1"
        />
        <path
          className="wh-code"
          strokeWidth="2.1"
          stroke="var(--purple-color)"
          d="M19.6,41.6 C25.2,38.0 31.3,35.1 37.6,33.0"
        />
        <path className="wh-code" strokeWidth="2.1" d="M18.6,35.4 C27.9,31.9 37.1,27.5 45.7,22.5" />
      </svg>

      <div className="flex gap-2.5 items-center sm:justify-end mb-2">
        <div className="font-mono text-[0.72rem] text-muted opacity-[0.65]">// 02</div>
        <div className="font-caveat text-xl sm:text-2xl font-bold text-foreground tracking-[0.080em]">
          Work Experience
        </div>
      </div>
      <p className="mb-4 sm:mb-6 text-xs sm:text-sm sm:text-right lg:max-w-160 text-muted font-poppins-sans leading-[1.8] tracking-[0.012em]">
        And then, after graduation, everything I had learned and experienced along the way started
        turning into real work, with projects across banking, geospatial, and carbon certification.
      </p>

      <div className="tl-list pl-4 sm:pl-6.75 lg:pl-20">
        {TOP_WORK.map((w) => (
          <div key={w.year} className="tl-row pb-0.5">
            <svg
              className="tl-dot"
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="5.5" cy="5.5" r="3.6" fill="var(--purple-color)" />
            </svg>

            <div className="flex flex-col gap-1 ml-4">
              <span className="font-mono text-xs sm:text-sm text-foreground">{w.title}</span>

              <span className="inline-flex items-start sm:items-center gap-1.5 font-mono text-[10px] sm:text-xs text-muted">
                <span className="flex items-center gap-2 shrink-0 hover:text-foreground underline">
                  {w.place}
                </span>{" "}
                | {w.year}
              </span>

              <div className="mt-1.5 text-xs sm:text-sm flex flex-col gap-2 text-muted font-poppins-sans leading-[1.7]">
                <span> {w.desc}</span>
                <span>Here’s the tech stack I’ve worked with :</span>
              </div>

              <div className="flex items-center justify-start gap-5 mt-2 flex-wrap">
                {WORK_STACK.map(([slug, name], i) => (
                  <span key={slug} className={`${stackSlot(i, "inline-flex")} items-center gap-2`}>
                    <span
                      className="stack-logo [--size:0.7rem] sm:[--size:1.05rem]"
                      role="img"
                      aria-label={name}
                      style={{
                        ["--ico" as string]: `url(/assets/icons/${slug}.svg)`,
                      }}
                    />
                    <span className="font-mono text-[10px] sm:text-xs text-muted">{name}</span>
                  </span>
                ))}
                <span className="font-mono text-[10px] sm:text-xs text-muted">+5</span>
              </div>

              <div className="flex justify-start mt-2 sm:mt-4">
                <span className="text-xs sm:text-sm text-muted">
                  More about those work experiences in{" "}
                  <Link
                    href="/experience"
                    className="font-medium text-foreground underline hover:text-purple"
                  >
                    Works
                  </Link>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
