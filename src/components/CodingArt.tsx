"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const CODE_BARS = [
  { w: 52, pad: 0, c: "var(--purple-color)" },
  { w: 74, pad: 8, c: "var(--green-color)" },
  { w: 61, pad: 8, c: "var(--blue-color)" },
  { w: 84, pad: 16, c: "var(--orange-color)" },
  { w: 44, pad: 8, c: "var(--teal-color)" },
  { w: 30, pad: 0, c: "var(--red-color)" },
];

const SPARKS = [{ x: 364, y: 62, r: 6 }];

const starPath = (cx: number, cy: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = ((-90 + i * 36) * Math.PI) / 180;
    return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join(" L")} Z`;
};

const BLOOM = { core: 3, petal: 7.5, count: 6, spread: 0.48 };
const VASE_MOUTH = { x: 194, y: 112 };

const FLOWERS = [
  { cx: 181, cy: 78, ink: "var(--purple-color)", stem: "M194,112 C191,104 184,88 181,80" },
  { cx: 191, cy: 52, ink: "var(--red-color)", stem: "M194,112 C193,98 191,68 191,55" },
  { cx: 201, cy: 72, ink: "var(--orange-color)", stem: "M194,112 C197,102 201,84 201,74" },
];

const petalPath = (cx: number, cy: number, i: number) => {
  const a = (i / BLOOM.count) * Math.PI * 2 - Math.PI / 2;
  const at = (ang: number, dist: number) =>
    `${(cx + Math.cos(ang) * dist).toFixed(1)},${(cy + Math.sin(ang) * dist).toFixed(1)}`;
  return `M${at(a, BLOOM.core)} C${at(a - BLOOM.spread, BLOOM.petal * 1.25)} ${at(a + BLOOM.spread, BLOOM.petal * 1.25)} ${at(a, BLOOM.core)}`;
};

export function CodingArt() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const strokes = self.selector!(".ca-draw") as SVGPathElement[];
      const bars = self.selector!(".ca-bar") as HTMLElement[];

      strokes.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(strokes, { strokeDashoffset: 0 });
        gsap.set(bars, { scaleX: 1 });
        return;
      }

      gsap
        .timeline({ delay: 0.3 })
        .to(strokes, {
          strokeDashoffset: 0,
          duration: 0.45,
          ease: "power1.inOut",
          stagger: 0.05,
        })
        .add(() => {
          gsap.to(self.selector!(".ca-float"), {
            y: -5,
            duration: 2.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.4,
          });

          gsap.to(self.selector!(".ca-code"), {
            scale: 1.14,
            svgOrigin: "117 235",
            duration: 1.9,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });

          (self.selector!(".ca-steam") as SVGPathElement[]).forEach((el, i) => {
            const len = el.getTotalLength();

            const base = el.getPointAtLength(0);
            gsap.set(el, { y: 2, opacity: 0, strokeDashoffset: 0, scale: 0.9 });
            gsap.to(el, {
              svgOrigin: `${base.x} ${base.y}`,
              keyframes: [
                { y: -2, x: 0.6, scale: 1, opacity: 1, duration: 0.7, ease: "sine.out" },
                {
                  y: -7,
                  x: -0.8,
                  scale: 1.14,
                  strokeDashoffset: -len,
                  duration: 1.5,
                  ease: "sine.inOut",
                },
                { y: 2, x: 0, scale: 0.9, opacity: 0, strokeDashoffset: 0, duration: 0.01 },
              ],
              repeat: -1,
              delay: i * 0.9,
            });
          });

          gsap.to(self.selector!(".ca-leaf"), {
            rotation: 3,
            svgOrigin: `${VASE_MOUTH.x} ${VASE_MOUTH.y}`,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        });

      gsap
        .timeline({ repeat: -1, repeatDelay: 0.8, delay: 1 })
        .to(bars, { scaleX: 1, duration: 0.28, ease: "power2.out", stagger: 0.16 })
        .to(bars, { scaleX: 0, duration: 0.22, ease: "power2.in", stagger: 0.06 }, "+=1.6");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="coding-art" ref={rootRef}>
      <svg className="coding-art-img" viewBox="0 0 1536 1024" role="img" aria-label="Sketsa a girl">
        <defs>
          <mask
            id="coding-art-mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1536"
            height="1024"
          >
            <image href="/assets/images/sketsa_girl.png" width="1536" height="1024" />
          </mask>
          <filter
            id="ca-steam-blur"
            filterUnits="userSpaceOnUse"
            x="30"
            y="158"
            width="42"
            height="50"
          >
            <feGaussianBlur stdDeviation="0.55" />
          </filter>
          <filter id="coding-art-glow" x="-8%" y="-8%" width="116%" height="116%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect
          width="1536"
          height="1024"
          fill="var(--muted-color)"
          mask="url(#coding-art-mask)"
          filter="url(#coding-art-glow)"
          opacity="0.12"
        />
        <rect
          width="1536"
          height="1024"
          fill="var(--muted-color)"
          mask="url(#coding-art-mask)"
          opacity="0.5"
        />
      </svg>

      <div className="coding-art-screen">
        {CODE_BARS.map((bar, i) => (
          <span
            key={i}
            className="ca-bar"
            style={{ width: `${bar.w}%`, marginLeft: `${bar.pad}%`, background: bar.c }}
          />
        ))}
      </div>

      <svg
        className="coding-art-doodle"
        viewBox="0 0 384 256"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="ca-steam-grad"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="196"
            x2="0"
            y2="168"
          >
            <stop offset="0%" style={{ stopColor: "var(--ca-steam-ink)", stopOpacity: 0.9 }} />
            <stop offset="55%" style={{ stopColor: "var(--ca-steam-ink)", stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: "var(--muted-color)", stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        {SPARKS.map((sp) => (
          <g className="ca-float" key={`${sp.x}-${sp.y}`}>
            <path className="ca-draw" d={starPath(sp.x, sp.y, sp.r)} strokeWidth="1.5" />
          </g>
        ))}

        <g className="ca-float ca-code" opacity="0.65" strokeWidth="1.4" strokeLinejoin="round">
          <path className="ca-draw" d="M112,230 L108,235 L112,240" />
          <path className="ca-draw" d="M119,230 L115,240" />
          <path className="ca-draw" d="M122,230 L126,235 L122,240" />
        </g>

        <g className="ca-float ca-object" stroke="var(--muted-color)" opacity="0.5">
          <path className="ca-draw" d="M32,204 C32,224 38,233 48,233 C58,233 64,224 64,204" />
          <path className="ca-draw" d="M28,204 C37,200 59,200 68,204" />
          <path className="ca-draw" d="M32,210 C23,210 21,222 32,224" strokeWidth="1.4" />
        </g>
        <g stroke="url(#ca-steam-grad)" strokeWidth="1.6" filter="url(#ca-steam-blur)">
          <path className="ca-draw ca-steam" d="M42,195 C38,190 46,186 42,182" />
          <path className="ca-draw ca-steam" d="M48,190 C44,185 52,181 48,176" />
          <path className="ca-draw ca-steam" d="M54,195 C58,190 50,186 54,182" />
        </g>

        <g className="ca-object" stroke="var(--muted-color)" strokeWidth="1.5" opacity="0.5">
          <path
            className="ca-draw"
            d="M184,114 C183,127 187,138 194,138 C201,138 205,127 204,114"
          />
          <path className="ca-draw" d="M180,113 C189,109 199,109 208,113" />
        </g>

        <g className="ca-leaf" opacity="0.55">
          {FLOWERS.map((f) => (
            <path
              key={`stem-${f.cx}`}
              className="ca-draw"
              d={f.stem}
              stroke="var(--teal-color)"
              strokeWidth="1.7"
            />
          ))}
          <path
            className="ca-draw"
            d="M188,98 C181,94 175,100 180,106 C185,111 188,104 188,98"
            stroke="var(--teal-color)"
            strokeWidth="1.5"
          />
          <path
            className="ca-draw"
            d="M197,92 C204,88 209,94 205,100 C200,104 196,98 197,92"
            stroke="var(--teal-color)"
            strokeWidth="1.5"
          />
          {FLOWERS.map((f) =>
            Array.from({ length: BLOOM.count }, (_, i) => (
              <path
                key={`petal-${f.cx}-${i}`}
                className="ca-draw"
                d={petalPath(f.cx, f.cy, i)}
                stroke={f.ink}
                strokeWidth="1.4"
              />
            )),
          )}
          {FLOWERS.map((f) => (
            <path
              key={`core-${f.cx}`}
              className="ca-draw"
              d={`M${f.cx - BLOOM.core},${f.cy} C${f.cx - BLOOM.core},${f.cy - 4.4} ${f.cx + BLOOM.core},${f.cy - 4.4} ${f.cx + BLOOM.core},${f.cy} C${f.cx + BLOOM.core},${f.cy + 4.4} ${f.cx - BLOOM.core},${f.cy + 4.4} ${f.cx - BLOOM.core},${f.cy}`}
              stroke="var(--amber-color)"
              strokeWidth="1.3"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
