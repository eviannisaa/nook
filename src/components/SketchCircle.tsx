"use client";

export function SketchCircle({ ink, dim = false }: { ink: string; dim?: boolean }) {
  return (
    <svg
      viewBox="0 0 52 52"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 sm:h-13 sm:w-13 overflow-visible"
      style={{ opacity: dim ? 0.55 : 1, transition: "opacity 0.2s ease" }}
      aria-hidden="true"
    >
      <g stroke={ink} strokeWidth="1.5" strokeLinecap="round" opacity="0.3">
        <path d="M44 38 L48 34" />
        <path d="M42 43 L47 39" />
        <path d="M37 46 L42 43" />
      </g>
      <circle
        cx="26"
        cy="26"
        r="21.5"
        fill="none"
        stroke={ink}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="46 7 30 5 38 9"
        opacity="0.4"
        transform="rotate(14 26 26)"
      />
      <circle
        cx="26"
        cy="26"
        r="22"
        fill="var(--bg-color)"
        stroke={ink}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeDasharray="62 5 44 4 52 7"
      />
    </svg>
  );
}
