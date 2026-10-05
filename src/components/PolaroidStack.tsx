"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function PolaroidStack({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const paths = self.selector!(".ps-draw") as SVGPathElement[];

      paths.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" });
        return;
      }

      const tl = gsap
        .timeline({ paused: true })
        .to(paths, {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: "power1.inOut",
          stagger: 0.06,

          onComplete: () => gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" }),
        })
        .add(() => {
          gsap.to(self.selector!(".polaroid-arrow"), {
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

  return (
    <div ref={rootRef} className="polaroid-stack">
      {children}

      <svg
        className="polaroid-arrow"
        viewBox="0 0 92 62"
        fill="none"
        stroke="var(--muted-color)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path className="ps-dash ps-draw" d="M4,19 C9,38 24,51 44,46 C56,43 65,35 71,26" />

        <path className="ps-draw" d="M61,27 L72,25 L70,36" />
      </svg>
    </div>
  );
}
