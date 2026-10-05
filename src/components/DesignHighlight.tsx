"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { designs, DESIGN_MORE } from "@/data/designs";
import { SketchFrame } from "@/components/SketchFrame";

const MONO = "'JetBrains Mono', monospace";
const ACCENT = "var(--purple-color)";
const CARD = "sketch sketch-card relative";

const TOP_DESIGNS = designs.slice(0, 1);

export function DesignHighlight() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const block = rootRef.current;
      if (!block) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
        /* melayang pelan setelah tergambar, sama seperti PageDoodles di home */
        .add(() => {
          gsap.to(block.querySelector(".ah-doodle"), {
            y: -6,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });

          const sketch = block.querySelector(".ah-sketch");
          if (sketch) {
            gsap.to(sketch, { y: -5, duration: 3.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
            gsap.to(sketch, {
              rotation: 0.9,
              transformOrigin: "50% 50%",
              duration: 5.1,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            });
          }

          gsap.to(block.querySelectorAll(".ah-sketch-mark"), {
            y: -4,
            rotation: 5,
            svgOrigin: "0 0",
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.7,
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
    <section ref={rootRef} className="ah-block relative mt-16">
      <svg
        className="ah-doodle hidden lg:block absolute pointer-events-none"
        style={{ top: "3.6rem", right: 0, width: 30 }}
        viewBox="0 0 40 40"
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
        aria-hidden="true"
      >
        <path
          className="ah-draw"
          d="M20,5 L23.7,14.9 L34.3,15.4 L26,21.9 L28.8,32.1 L20,26.3 L11.2,32.1 L14,21.9 L5.7,15.4 L16.3,14.9 Z"
        />
      </svg>

      <div>
        <div
          className="mb-4"
          style={{
            fontFamily: MONO,
            fontSize: "0.72rem",
            color: "var(--muted-color)",
            opacity: 0.65,
          }}
        >
          // 05
        </div>
        <div
          className="mb-4"
          style={{ fontFamily: MONO, fontSize: "0.7rem", color: "var(--muted-color)" }}
        >
          <span style={{ color: ACCENT }}>$ </span>
          open ~/design
        </div>
      </div>

      <p
        className="mb-5 lg:max-w-160"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "0.88rem",
          lineHeight: 1.8,
          letterSpacing: "0.012em",
          color: "var(--muted-color)",
        }}
      >
        And somewhere in between, I picked up{" "}
        <span style={{ color: "var(--fg-color)" }}>design</span>. Small interface studies mostly:
        spacing, type scale, figuring out how a screen should feel before writing any code.
      </p>

      <div className="ah-grid grid md:grid-cols-2 gap-4 mb-4">
        {TOP_DESIGNS.map((d) => (
          <a
            key={d.title}
            href={d.href ?? DESIGN_MORE}
            target={d.href ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={`ah-item ${CARD}`}
          >
            <SketchFrame />
            <div className="inner">
              {d.img ? (
                <img
                  src={d.img}
                  alt={d.title}
                  className="block w-full"
                  style={{ aspectRatio: "16 / 10", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{ aspectRatio: "16 / 10", borderBottom: "1px solid var(--border-color)" }}
                >
                  <svg width="60%" height="58%" viewBox="0 0 120 70" fill="none" aria-hidden="true">
                    <path
                      d="M14,54 C30,36 40,44 52,30 C62,19 74,34 86,25 C94,19 100,26 106,22"
                      stroke="var(--border-color)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
              <div className="px-4 py-3">
                <div style={{ fontFamily: MONO, fontSize: "0.72rem", color: "var(--fg-color)" }}>
                  {d.title}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: "0.62rem",
                    color: "var(--muted-color)",
                    marginTop: "3px",
                  }}
                >
                  {d.note}
                </div>
              </div>
            </div>
          </a>
        ))}

        <div className="ah-item flex flex-col items-center justify-center gap-3 py-2">
          <svg
            className="ah-sketch w-full"
            style={{ maxWidth: 235 }}
            viewBox="0 0 160 116"
            fill="none"
            stroke="var(--muted-color)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
            aria-hidden="true"
          >
            <path
              className="ah-draw"
              strokeWidth="1.9"
              d="M24,13 C62,10 104,15 138,12 C147,11 152,17 151,26 C153,50 149,76 151,97
                 C152,106 146,110 137,109 C103,112 56,107 24,109 C14,110 8,105 9,96
                 C7,71 11,43 9,25 C8,16 14,11 23,13 C29,13 35,14 42,13"
            />
            <path className="ah-draw" strokeWidth="1.6" d="M10,29 C56,26 106,31 150,27" />

            {/* blok gambar, sudutnya ikut membulat */}
            <path
              className="ah-draw"
              strokeWidth="1.6"
              d="M29,43 C48,41 68,45 84,42 C90,41 94,45 93,51 C95,62 92,72 93,79
                 C94,85 90,88 84,87 C66,89 46,85 30,88 C24,89 20,85 21,79
                 C19,68 23,56 21,49 C20,44 24,42 29,43"
            />
            <path className="ah-draw" strokeWidth="1.5" d="M24,85 C42,69 60,56 90,44" />

            {/* baris teks, lengkungnya dibedakan supaya tidak seragam */}
            <path className="ah-draw" strokeWidth="1.5" d="M104,49 C117,46 133,52 146,47" />
            <path className="ah-draw" strokeWidth="1.5" d="M104,61 C115,59 128,64 140,59" />
            <path className="ah-draw" strokeWidth="1.5" d="M104,73 C120,71 131,76 147,71" />

            {/* dua marka lepas, memakai warna bagian ini dan bergerak sendiri */}
            <path
              className="ah-draw ah-sketch-mark"
              strokeWidth="2"
              stroke="var(--purple-color)"
              d="M133,95 C142,89 153,97 147,104 C142,109 133,104 135,97"
            />
            <path
              className="ah-draw ah-sketch-mark"
              strokeWidth="2"
              stroke="var(--purple-color)"
              d="M15,97 C22,90 29,104 37,96"
            />
          </svg>
          <span
            className="font-caveat"
            style={{ fontSize: "1.05rem", color: "var(--muted-color)" }}
          >
            wireframe first
          </span>
        </div>
      </div>

      <div>
        <a href={DESIGN_MORE} rel="noopener noreferrer">
          <span className="inline-flex items-center gap-1.5">
            <span style={{ fontFamily: MONO, fontSize: "0.7rem", color: "var(--muted-color)" }}>
              see more designs
            </span>
            {/* panah tangan, bukan karakter panah: sejalan dengan goresan lain */}
            <svg width="17" height="9" viewBox="0 0 17 9" fill="none" aria-hidden="true">
              <path
                d="M1,4.6 C5,4.1 10,4.9 15.4,4.4"
                stroke={ACCENT}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12.2,1.6 C13.4,2.8 14.6,3.9 15.8,4.5 C14.6,5.3 13.5,6.4 12.4,7.6"
                stroke={ACCENT}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </a>
      </div>
    </section>
  );
}
