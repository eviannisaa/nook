"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Mark = {
  top: string;
  left?: string;
  right?: string;
  w: number;
  box: string;
  paths: string[];
  ink?: string;
  sw?: number;
  hide?: string;
};

export const STAR =
  "M20,5 L23.7,14.9 L34.3,15.4 L26,21.9 L28.8,32.1 L20,26.3 L11.2,32.1 L14,21.9 L5.7,15.4 L16.3,14.9 Z";
const WAVE = "M4,16 C12,6 20,24 28,14 C34,8 40,20 45,14";

export const RING =
  "M4.89,2.05 C5.26,2.05 6.51,1.75 7.08,2.04 C7.64,2.34 7.92,3.22 8.28,3.84 C8.64,4.45 9.26,5.13 9.21,5.74 C9.17,6.34 8.45,6.93 8.02,7.48 C7.58,8.02 7.18,8.82 6.59,9.01 C6.01,9.21 5.19,8.85 4.52,8.65 C3.85,8.45 2.96,8.31 2.54,7.82 C2.13,7.34 2.06,6.43 2.01,5.72 C1.96,5.01 1.88,4.08 2.24,3.55 C2.60,3.02 3.50,2.84 4.15,2.55 C4.81,2.27 5.81,1.96 6.15,1.84";

export const DOTS = ["M6,10 L8,10", "M18,14 L20,14", "M30,10 L32,10"];

const GRID_MARKS: Mark[] = [
  // strip kiri kolom bio, sejajar bagian atas polaroid
  {
    top: "3%",
    left: "0.5%",
    w: 22,
    box: "0 0 40 40",
    paths: [
      "M20.0,6.0 L23.5,15.3 L33.3,15.8 L25.6,22.0 L28.2,31.3 L20.0,25.9 L11.8,31.3 L14.4,22.0 L6.7,15.8 L16.5,15.3 Z",
    ],
    hide: "hidden sm:block",
  },
  // strip kanan kolom bio, menghadap celah antar kolom
  {
    top: "20%",
    left: "44%",
    w: 26,
    box: "0 0 48 28",
    paths: ["M4,16 C12,6 20,24 28,14 C34,8 40,20 45,14"],
    hide: "hidden md:block",
  },
  // di bawah paragraf bio, memakai ruang mb-10 milik grid
  {
    top: "100%",
    left: "18%",
    w: 30,
    box: "0 0 40 20",
    paths: ["M6,10 L8,10", "M18,14 L20,14", "M30,10 L32,10"],
    sw: 2.6,
    hide: "hidden sm:block",
  },
];

function DoodleLayer({ marks }: { marks: Mark[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const paths = self.selector!(".ad-draw") as SVGPathElement[];

      paths.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(paths, { strokeDashoffset: 0 });
        return;
      }

      const tl = gsap
        .timeline({ paused: true })
        .to(paths, {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: "power1.inOut",
          stagger: 0.06,
        })
        .add(() => {
          gsap.to(self.selector!(".ad-mark"), {
            y: -5,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: { each: 0.32, from: "random" },
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

  return (
    <div ref={rootRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      {marks.map((m, i) => (
        <svg
          key={i}
          className={`ad-mark absolute ${m.hide ?? ""}`}
          style={{ top: m.top, left: m.left, right: m.right, width: m.w }}
          viewBox={m.box}
          fill="none"
          stroke={m.ink ?? "var(--muted-color)"}
          strokeWidth={m.sw ?? 1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.45"
        >
          {m.paths.map((d, j) => (
            <path key={j} className="ad-draw" d={d} />
          ))}
        </svg>
      ))}
    </div>
  );
}

const CARD_MARKS: Mark[] = [
  {
    top: "2%",
    right: "3%",
    w: 13,
    box: "0 0 40 40",
    paths: [
      "M20,6 L23.5,15.3 L33.3,15.8 L25.6,22 L28.2,31.3 L20,25.9 L11.8,31.3 L14.4,22 L6.7,15.8 L16.5,15.3 Z",
    ],
  },
  {
    top: "84%",
    right: "5%",
    w: 24,
    box: "0 0 40 20",
    paths: ["M6,10 L8,10", "M18,13 L20,13", "M30,10 L32,10"],
    sw: 2.6,
  },
];

const PAGE_MARKS: Mark[] = [
  {
    top: "8%",
    right: "calc(3% + 76px)",
    ink: "var(--blue-color)",
    w: 26,
    box: "0 0 40 20",
    sw: 2.6,
    hide: "hidden xl:block",
    paths: DOTS,
  },
  {
    top: "27%",
    left: "calc(50% - 512px - 60px)",
    w: 34,
    box: "0 0 48 28",
    hide: "hidden xl:block",
    paths: [WAVE],
  },
];

export function AboutPageDoodles() {
  return <DoodleLayer marks={PAGE_MARKS} />;
}

export function AboutDoodles() {
  return <DoodleLayer marks={GRID_MARKS} />;
}

export function CardDoodles() {
  return <DoodleLayer marks={CARD_MARKS} />;
}
