"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const ACCENT = "var(--fg-color)";

type Data = {
  user: string;
  repos: number | null;
  prs: number | null;
  commits: number | null;
  days: { d: string; l: number }[];
  total: number | null;
};

const LEVEL = [0.16, 0.38, 0.58, 0.78, 1.0];

const CELL = 11;
const GAP = 3;

export function GithubPanel() {
  const [data, setData] = useState<Data | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/github")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setData(j))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const draws = self.selector!(".gh-mark-draw") as SVGPathElement[];
      if (!draws.length) return;

      draws.forEach((d) => {
        const len = d.getTotalLength();
        gsap.set(d, { strokeDasharray: len, strokeDashoffset: len });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(draws, { strokeDashoffset: 0 });
        return;
      }

      const tl = gsap
        .timeline({ paused: true })
        .to(draws, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut", stagger: 0.06 })
        .add(() => {
          gsap.to(self.selector!(".gh-mark"), {
            y: -5,
            duration: 2.6,
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
      if (rootRef.current) io.observe(rootRef.current);

      return () => io.disconnect();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const stats: [string, number | null][] = [
    ["commits", data?.commits ?? null],
    ["pull requests", data?.prs ?? null],
    ["repositories", data?.repos ?? null],
  ];

  const days = data?.days ?? [];
  const DAY_MS = 86400000;

  const times = days.map((x) => Date.parse(x.d + "T00:00:00Z"));
  const min = times.length ? Math.min(...times) : 0;
  const start = min - new Date(min).getUTCDay() * DAY_MS;
  const colOf = (ts: number) => Math.floor((ts - start) / (7 * DAY_MS));
  const cols = times.length ? Math.max(...times.map(colOf)) + 1 : 0;
  const w = cols * (CELL + GAP) - GAP;
  const h = 7 * (CELL + GAP) - GAP;

  return (
    <div ref={rootRef} className="relative w-full">
      <svg
        className="gh-mark hidden lg:block absolute pointer-events-none"
        style={{ top: "0.38rem", left: "1rem", width: 34 }}
        viewBox="0 0 48 28"
        fill="none"
        stroke="var(--teal-color)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
        aria-hidden="true"
      >
        <path className="gh-mark-draw" d="M4,16 C12,6 20,24 28,14 C34,8 40,20 45,14" />
      </svg>

      <div className="lg:ml-auto lg:max-w-160">
        <div className="flex gap-2.5 items-center sm:justify-end mb-2">
          <div className="font-mono text-[0.72rem] text-muted opacity-[0.65]">// 04</div>
          <div className="font-caveat text-xl sm:text-2xl font-bold text-foreground tracking-[0.080em]">
            What I’ve Been Coding
          </div>
        </div>
        <p className="mb-4 sm:mb-6 lg:max-w-160 text-xs sm:text-sm text-muted sm:text-right font-poppins-sans leading-[1.8] tracking-[0.012em]">
          Some of the things I build end up here. This part comes straight from GitHub, so you can
          see what I’ve been coding lately.
        </p>
      </div>

      {days.length > 0 && (
        <>
          <div className="gh-graph-wrap">
            <svg
              className="gh-graph"
              viewBox={`0 0 ${w} ${h}`}
              preserveAspectRatio="xMinYMid meet"
              role="img"
              aria-label={`Aktivitas kontribusi GitHub ${data?.user ?? ""}`}
            >
              {days.map((day, i) => {
                const ts = times[i];
                return (
                  <rect
                    key={day.d}
                    className="gh-cell"
                    x={colOf(ts) * (CELL + GAP)}
                    y={new Date(ts).getUTCDay() * (CELL + GAP)}
                    width={CELL}
                    height={CELL}
                    rx="2.5"
                    fill={ACCENT}
                    fillOpacity={LEVEL[day.l] ?? LEVEL[0]}
                  />
                );
              })}
            </svg>
          </div>

          {data?.total !== null && data?.total !== undefined && (
            <div className="mt-4 font-mono text-[10px] sm:text-xs text-muted sm:text-right">
              {data.total.toLocaleString("en-US")} contributions in the last year
            </div>
          )}
        </>
      )}
    </div>
  );
}
