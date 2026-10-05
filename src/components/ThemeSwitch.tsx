"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const W = 42;
const H = 22;
const CY = H / 2;
const KNOB_R = 7.5;
const KNOB_LEFT = H / 2;
const KNOB_RIGHT = W - H / 2;

/**
 * Hand-drawn theme switch. Same pencil vocabulary as the floating contact
 * buttons — every stroke drawn twice, the second pass offset and faded, with
 * irregular dashes so no line closes cleanly — but kept monochrome and thin so
 * it stays a quiet piece of nav furniture rather than an accent.
 */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const isLight = theme === "light";

  const ink = isLight
    ? hovered
      ? "var(--orange-color)"
      : "var(--amber-color)"
    : hovered
      ? "var(--fg-color)"
      : "var(--muted-color)";
  const knobX = isLight ? KNOB_RIGHT : KNOB_LEFT;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label="Toggle theme"
      title={isLight ? "Switch to dark" : "Switch to light"}
      onClick={() => setTheme((p) => (p === "light" ? "dark" : "light"))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="shrink-0 relative bg-transparent border-none p-0 cursor-pointer"
      style={{
        width: W,
        height: H,
        transform: hovered ? "rotate(0deg)" : "rotate(-1deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        <rect
          x="1.5"
          y="1.5"
          width={W - 3}
          height={H - 3}
          rx={(H - 3) / 2}
          fill="var(--surface-color)"
          stroke="var(--border-color)"
          strokeWidth="1.3"
          strokeDasharray="24 3 17 2 20 4"
          strokeLinecap="round"
        />
        <rect
          x="2.4"
          y="2.4"
          width={W - 4.8}
          height={H - 4.8}
          rx={(H - 4.8) / 2}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="0.9"
          strokeDasharray="14 5 20 3"
          strokeLinecap="round"
          opacity="0.35"
          transform={`rotate(0.8 ${W / 2} ${CY})`}
        />

        <g
          style={{
            transform: `translateX(${knobX}px)`,
            transition: "transform 0.3s cubic-bezier(0.34, 1.4, 0.5, 1)",
          }}
        >
          <circle
            cx="0"
            cy={CY}
            r={KNOB_R}
            fill="none"
            stroke={ink}
            strokeWidth="0.9"
            strokeDasharray="11 4 13 3"
            strokeLinecap="round"
            opacity="0.35"
            transform={`rotate(20 0 ${CY})`}
          />
          <circle
            cx="0"
            cy={CY}
            r={KNOB_R}
            fill="var(--bg-color)"
            stroke={ink}
            strokeWidth="1.4"
            strokeDasharray="18 2.5 13 2.5 15 3"
            strokeLinecap="round"
            style={{ transition: "stroke 0.15s ease" }}
          />

          <g
            stroke={ink}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            style={{
              opacity: isLight ? 1 : 0,
              transition: "opacity 0.18s ease, stroke 0.15s ease",
            }}
          >
            <circle cx="0" cy={CY} r="2.4" />
            <path d={`M0 ${CY - 5.4}v1.3`} />
            <path d={`M0 ${CY + 4.1}v1.3`} />
            <path d={`M-5.4 ${CY}h1.3`} />
            <path d={`M4.1 ${CY}h1.3`} />
            <path d={`M-3.9 ${CY - 3.9}l0.9 0.9`} />
            <path d={`M3.0 ${CY + 3.0}l0.9 0.9`} />
            <path d={`M3.9 ${CY - 3.9}l-0.9 0.9`} />
            <path d={`M-3.0 ${CY + 3.0}l-0.9 0.9`} />
          </g>

          <path
            d={`M1.2 ${CY - 3.5}A3.7 3.7 0 1 0 1.2 ${CY + 3.5}A4.8 4.8 0 1 1 1.2 ${CY - 3.5}Z`}
            fill={ink}
            stroke="none"
            style={{ opacity: isLight ? 0 : 1, transition: "opacity 0.18s ease, fill 0.15s ease" }}
          />
        </g>
      </svg>
    </button>
  );
}

export default ThemeSwitch;
