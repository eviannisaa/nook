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

const MARKS: Mark[] = [
  // pita atas
  {
    top: "86%",
    left: "10%",
    w: 30,
    box: "0 0 40 40",
    paths: [
      "M20.0,5.0 L23.7,14.9 L34.3,15.4 L26.0,21.9 L28.8,32.1 L20.0,26.3 L11.2,32.1 L14.0,21.9 L5.7,15.4 L16.3,14.9 Z",
    ],
  },
  {
    top: "9%",
    left: "26%",
    w: 46,
    box: "0 0 48 28",
    paths: ["M4,16 C12,6 20,24 28,14 C34,8 40,20 45,14"],
    ink: "#79c0ff",
  },
  // sisi kiri
  // sisi kanan
  {
    top: "84%",
    right: "12%",
    w: 34,
    box: "0 0 40 40",
    paths: [
      "M20.0,6.0 L23.5,15.3 L33.3,15.8 L25.6,22.0 L28.2,31.3 L20.0,25.9 L11.8,31.3 L14.4,22.0 L6.7,15.8 L16.5,15.3 Z",
    ],
    ink: "var(--purple-color)",
    hide: "hidden md:block",
  },
  // pita bawah
  {
    top: "90%",
    left: "40%",
    w: 30,
    box: "0 0 40 20",
    paths: ["M6,10 L8,10", "M18,14 L20,14", "M30,10 L32,10"],
    sw: 2.6,
    hide: "hidden sm:block",
  },
];

export function PageDoodles() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const paths = self.selector!(".pd-draw") as SVGPathElement[];

      paths.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(paths, { strokeDashoffset: 0 });
        return;
      }

      gsap
        .timeline({ delay: 0.5 })
        .to(paths, {
          strokeDashoffset: 0,
          duration: 0.45,
          ease: "power1.inOut",
          stagger: 0.04,
        })
        .add(() => {
          gsap.to(self.selector!(".pd-mark"), {
            y: -6,
            duration: 2.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: { each: 0.28, from: "random" },
          });
        });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      {MARKS.map((m, i) => (
        <svg
          key={i}
          className={`pd-mark absolute ${m.hide ?? ""}`}
          style={{ top: m.top, left: m.left, right: m.right, width: m.w }}
          viewBox={m.box}
          fill="none"
          stroke={m.ink ?? "var(--muted-color)"}
          strokeWidth={m.sw ?? 1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        >
          {m.paths.map((d, j) => (
            <path key={j} className="pd-draw" d={d} />
          ))}
        </svg>
      ))}
    </div>
  );
}
