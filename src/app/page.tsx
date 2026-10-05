"use client";

import { useTheme } from "@/components/ThemeProvider";
import { CodingArt } from "@/components/CodingArt";
import { PageDoodles } from "@/components/PageDoodles";

const C = {
  bg: "var(--bg-color)",
  surface: "var(--surface-color)",
  surface2: "var(--surface2-color)",
  border: "var(--border-color)",
  muted: "var(--muted-color)",
  fg: "var(--fg-color)",
  green: "var(--green-color)",
  amber: "var(--amber-color)",
  blue: "var(--blue-color)",
  purple: "var(--purple-color)",
  red: "var(--red-color)",
  teal: "var(--teal-color)",
  orange: "var(--orange-color)",
};

export default function Home() {
  const { theme } = useTheme();
  return (
    <div className="mt-1 sm:mt-1">
      <section
        className="min-h-screen flex items-center relative overflow-hidden px-6 py-18 md:px-10 md:py-24 lg:px-20 lg:py-16 notebook"
        style={{ backgroundColor: C.bg }}
      >
        {/* doodle yang bertebaran di seluruh halaman, di bawah konten */}
        <PageDoodles />

        {/* margin line */}
        <div
          className="absolute top-0 bottom-0 left-4 md:left-8 lg:left-16 xl:left-18 w-[0.1px] bg-blue-600/25"
          style={{ pointerEvents: "none" }}
        />

        {/* floating doodles */}
        <svg
          className="hero-doodle float hidden"
          style={{ top: "4rem", right: "3rem" }}
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M28,4 L30,22 L48,18 L33,29 L43,46 L28,35 L13,46 L23,29 L8,18 L26,22 Z"
            stroke="#e8a838"
            strokeWidth="1.5"
            fill="rgba(232,168,56,0.12)"
            strokeLinejoin="round"
          />
          <path
            d="M49,6 L50,12 L56,10 L51,14 L54,20 L49,15 L44,20 L47,14 L42,10 L48,12 Z"
            stroke="#e05c4a"
            strokeWidth="1.2"
            fill="rgba(224,92,74,0.12)"
            strokeLinejoin="round"
          />
          <path
            d="M6,38 L7,44 L13,42 L9,46 L12,52 L7,47 L2,52 L5,46 L0,42 L6,44 Z"
            stroke="#4a8fa8"
            strokeWidth="1.2"
            fill="rgba(74,143,168,0.12)"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          className="hero-doodle wiggle hidden"
          style={{ bottom: "6rem", right: "7rem", opacity: 0.4 }}
          width="90"
          height="90"
          viewBox="0 0 90 90"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M45,8 C65,6 84,22 84,45 C84,68 67,83 45,83 C23,83 6,67 6,45 C6,24 22,9 45,8 Z"
            stroke="#e05c4a"
            strokeWidth="2"
            strokeDasharray="6 3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="hero-doodle hidden"
          style={{ top: "33.333%", right: "1.5rem", opacity: 0.3 }}
          width="100"
          height="14"
          viewBox="0 0 100 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2,7 Q12,2 22,7 Q32,12 42,7 Q32,2 42,7 Q52,12 62,7 Q52,2 62,7 Q72,12 82,7 Q72,2 82,7 Q92,12 102,7 Q92,2 102,7 Q112,12 122,7"
            stroke="#4a8fa8"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <svg
          className="hero-doodle hidden"
          style={{ bottom: "18rem", left: "6.5rem", opacity: 0.3 }}
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M28,4 L30,22 L48,18 L33,29 L43,46 L28,35 L13,46 L23,29 L8,18 L26,22 Z"
            stroke="#e8a838"
            strokeWidth="1.5"
            fill="rgba(232,168,56,0.12)"
            strokeLinejoin="round"
          />
          <path
            d="M49,6 L50,12 L56,10 L51,14 L54,20 L49,15 L44,20 L47,14 L42,10 L48,12 Z"
            stroke="#e05c4a"
            strokeWidth="1.2"
            fill="rgba(224,92,74,0.12)"
            strokeLinejoin="round"
          />
          <path
            d="M6,38 L7,44 L13,42 L9,46 L12,52 L7,47 L2,52 L5,46 L0,42 L6,44 Z"
            stroke="#4a8fa8"
            strokeWidth="1.2"
            fill="rgba(74,143,168,0.12)"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          style={{ opacity: 0.3 }}
          className="hero-doodle mb-35 bottom-0 right-160"
          width="80"
          height="14"
          viewBox="0 0 80 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2,7 Q12,2 22,7 Q32,12 42,7 Q32,2 42,7 Q52,12 62,7 Q52,2 62,7 Q72,12 82,7 Q72,2 82,7 Q92,12 102,7"
            stroke={theme === "dark" ? C.green : "#B4A899"}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>

        <div className="scroll-hint">
          <span className="hidden">scroll</span>
          <i></i>
        </div>

        <div className="max-w-5xl mx-auto w-full grid-cols-1 grid md:grid-cols-2 xl:grid-cols-[1fr_auto] items-center relative z-10">
          {/* ── left ── */}
          <div className="mb-14 lg:mb-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 72 72"
                  fill="none"
                >
                  <path
                    d="M36,3 C54,2 69,15 69,36 C69,57 55,69 36,69 C17,69 3,56 3,36 C3,16 18,3 36,3 Z"
                    stroke={C.green}
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <img
                  src="/assets/images/foto.jpg"
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    filter: "grayscale(15%)",
                  }}
                />
                <span
                  className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 animate-pulse"
                  style={{
                    backgroundColor: C.green,
                    borderColor: C.bg,
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: C.fg,
                  }}
                >
                  Evi Nur Annisa
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.66rem",
                    color: C.muted,
                  }}
                >
                  Software Engineer
                </div>
              </div>
            </div>

            {/* headline */}
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.88rem",
                lineHeight: "1.95",
                letterSpacing: "0.012em",
                color: C.muted,
              }}
              className="mb-7 lg:max-w-150"
            >
              I build things, learn new stuff, and turn little ideas into something real. I’m always
              curious, trying something new, and seeing where it takes me.
              <br />
              This is my little space for the things I’ve been working on.
            </p>

            {/* status */}
            <div
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-blue-600/10 border border-blue-600/5 rounded text-blue-500"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.68rem",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Available to Opportunity
            </div>

            {/* socials */}
            <div className="flex gap-2 flex-wrap items-center">
              <svg
                className="hidden sm:block"
                style={{ opacity: 0.4 }}
                width="48"
                height="38"
                viewBox="0 0 48 38"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4,19 Q19,5 36,17"
                  stroke={C.fg}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M31,11 L36,17 L29,19"
                  stroke={C.fg}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              {["Behance", "GitHub", "LinkedIn"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.66rem",
                    padding: "3px 9px",
                    border: `1px solid ${C.border}`,
                    borderRadius: "3px",
                    color: C.muted,
                    textDecoration: "none",
                    transition: "all 0.15s",
                    height: "fit-content",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#3B82F6";
                    e.currentTarget.style.borderColor = "#3B82F6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = C.muted;
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  ↗ {s}
                </a>
              ))}
            </div>
          </div>

          {/* ── right ── */}
          <div className="flex justify-center lg:justify-end w-11/12">
            <div className="hero-photo-stack">
              <CodingArt />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
