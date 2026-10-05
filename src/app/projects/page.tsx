"use client";

import { useState } from "react";
import { stackIcon, stackIconScale } from "@/lib/stackIcon";

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

function CardShell({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-[5px] bg-surface ${className}`}
      style={{
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.10), 0 10px 22px -14px rgba(0, 0, 0, 0.30)",
      }}
    >
      {children}
    </div>
  );
}

type FilterKey = "all" | "frontend" | "fullstack" | "backend";

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="bg-surface text-foreground border border-border pointer-events-none absolute bottom-full right-0 z-10 mb-2 translate-y-1 whitespace-nowrap rounded-[3px] px-2 py-1 font-mono text-[0.58rem] opacity-0 transition duration-400 ease-out group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-hover/tip:delay-300 motion-reduce:transition-none"
    >
      {children}
    </span>
  );
}

function StackIcon({ name, size }: { name: string; size: string }) {
  const ico = stackIcon(name);
  if (!ico) {
    return (
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="h-[0.3rem] w-[0.3rem] rounded-full border border-muted opacity-50" />
      </span>
    );
  }

  return (
    <span
      className="stack-logo shrink-0"
      aria-hidden="true"
      style={{
        ["--ico" as string]: ico,
        ["--size" as string]: `calc(${size} * ${stackIconScale(name)})`,
      }}
    />
  );
}

const PEEK_TILT = ["-7deg", "5deg", "-3deg", "8deg", "-5deg"];

const IMG_FRAME = {
  fill: "object-cover -translate-y-[4px] scale-[1.06] group-has-[.pj-reveal:hover]:translate-y-0 group-has-[.pj-reveal:hover]:scale-[1.12]",
  whole: "object-cover -translate-y-[0px] scale-[1.06] ",
} as const;

const ROLE_INK: Partial<Record<FilterKey, string>> = {
  fullstack: C.green,
  frontend: C.blue,
  backend: C.amber,
};

const linkHref = (u: string) => (/^https?:\/\//.test(u) ? u : `https://${u}`);
const linkText = (u: string) => u.replace(/^https?:\/\//, "");

export const projects = [
  {
    id: "tilik",
    title: "Tilik : Land and Property Check",
    role: "fullstack" as FilterKey,
    year: "2026",
    stack: ["TypeScript", "Astro.js", "Tailwind", "Python", "PostgreSQL", "MapLibre GL JS"],
    desc: "Exploring locations and nearby areas, helping you get a better look at risks, disasters, and other important information around a place, based on data from InaRISK, GDACS, USGS, and DIBI.",
    img: "/assets/images/tilik.png",
    imgPos: "object-center" as const,
    imgFrame: IMG_FRAME.fill,
    repo: "https://github.com/eviannisaa/tilik",
    demo: "https://github.com/eviannisaa/tilik",
  },
  {
    id: "hrsync-fe",
    title: "HRSync : Human Resource Synchronization",
    role: "frontend" as FilterKey,
    year: "2026",
    stack: ["TypeScript", "Next.js", "Tailwind", "TanStack Query", "MapLibre GL JS"],
    desc: "Bringing HR needs into one platform, making it easier to manage leave, overtime, reimbursements, KPIs, employee information, and feedback for a better workplace.",
    img: "/assets/images/hrsync.png",
    imgPos: "object-center" as const,
    imgFrame: IMG_FRAME.fill,
    repo: "https://github.com/eviannisaa/hrsync-fe",
    demo: "https://github.com/eviannisaa/hrsync-fe",
  },
  {
    id: "hrsync-be",
    title: "Hrsync : Human Resource Synchronization",
    role: "backend" as FilterKey,
    year: "2026",
    stack: ["Prisma ORM", "Golang", "MinIO", "PostgreSQL", "Resend API"],
    desc: "Bringing HR needs into one platform, making it easier to manage leave, overtime, reimbursements, KPIs, employee information, and feedback for a better workplace.",
    img: "/assets/images/hrsyncs.png",
    imgPos: "object-center" as const,
    imgFrame: IMG_FRAME.fill,
    repo: "https://github.com/eviannisaa/hrsync-be",
    demo: "https://github.com/eviannisaa/hrsync-be",
  },
  {
    id: "digital-library",
    title: "Digital Library",
    role: "frontend" as FilterKey,
    year: "2025",
    stack: ["TypeScript", "Astro.js", "Tailwind", "Python", "PostgreSQL", "MapLibre GL JS"],
    desc: "Exploring locations and nearby areas, helping you get a better look at risks, disasters, and other important information around a place, based on data from InaRISK, GDACS, USGS, and DIBI.",
    img: "/assets/images/digital-library.png",
    imgPos: "object-center" as const,
    imgFrame: IMG_FRAME.fill,
    repo: "https://github.com/eviannisaa/tilik",
    demo: "https://github.com/eviannisaa/tilik",
  },
];

const filterLabels: { key: FilterKey; label: string }[] = [
  { key: "all", label: "all" },
  { key: "frontend", label: "frontend" },
  { key: "fullstack", label: "fullstack" },
  { key: "backend", label: "backend" },
];

export default function Projects() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const visible = filter === "all" ? projects : projects.filter((p) => p.role === filter);

  return (
    <div className="relative mt-8 bg-background min-h-screen">
      <div className="px-6 pt-12 pb-6 max-w-5xl mx-auto">
        <h1 className="font-caveat text-[clamp(2rem,4vw,2.8rem)] font-bold text-foreground m-0">
          Ideas in Code
        </h1>
        <p className="lg:max-w-160 text-xs sm:text-sm text-muted leading-[1.8] font-poppins-sans tracking-[0.012em]">
          From simple ideas to working projects, here are a few things I’ve built while trying new
          things, learning, and having fun along the way.
        </p>
      </div>

      <div className="px-6 max-w-5xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:inline-flex rounded-md overflow-hidden border border-border">
          {filterLabels.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
              }}
              className="font-mono text-sm font-medium py-1.75 px-4 cursor-pointer border-none"
              style={{
                transition: "all 0.15s",
                backgroundColor: filter === f.key ? C.surface2 : "transparent",
                color: filter === f.key ? C.green : C.muted,
                borderRight: f.key !== "fullstack" ? `1px solid ${C.border}` : "none",
              }}
            >
              {filter === f.key && <span style={{ color: C.red }}>▶ </span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-20 max-w-5xl mx-auto grid gap-5 sm:grid-cols-2">
        {visible.map((p) => {
          const roleInk = ROLE_INK[p.role];
          const withIcon = p.stack.filter((t) => stackIcon(t));
          const peek = [...withIcon, ...p.stack.filter((t) => !stackIcon(t))].slice(0, 5);
          const rest = p.stack.filter((t) => !peek.includes(t));

          return (
            <CardShell key={p.id} className="group h-full">
              <div className="relative z-10 flex h-full flex-col">
                <div className="relative mx-3 mt-3 overflow-hidden rounded-[3px] bg-surface2">
                  <img
                    src={p.img}
                    alt={p.title}
                    loading="lazy"
                    className={`pj-reveal h-52 w-full origin-top ${p.imgPos} ${p.imgFrame} opacity-55 blur-[2px] saturate-[0.9] transition duration-1000 ease-in-out group-has-[.pj-reveal:hover]:opacity-100 group-has-[.pj-reveal:hover]:blur-[0px] group-has-[.pj-reveal:hover]:saturate-100`}
                  />

                  <span
                    className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 px-2.5 pt-5 pb-2 transition-opacity duration-1000 ease-in-out group-has-[.pj-reveal:hover]:opacity-0"
                    style={{
                      background: `linear-gradient(to top, color-mix(in srgb, ${C.bg} 92%, transparent), color-mix(in srgb, ${C.bg} 62%, transparent) 55%, transparent)`,
                    }}
                  >
                    {peek.map((t, i) => (
                      <span key={t} className="group/tip relative">
                        <span
                          className="stack-mark"
                          style={{
                            ["--tilt" as string]: PEEK_TILT[i % PEEK_TILT.length],
                            ["--accent" as string]: roleInk,
                          }}
                        >
                          <StackIcon name={t} size="0.95rem" />
                        </span>
                        <Tip>{t}</Tip>
                      </span>
                    ))}

                    {rest.length > 0 && (
                      <span
                        className="group/tip relative"
                        style={{ ["--accent" as string]: roleInk }}
                      >
                        <span className="font-mono text-xs text-muted group-hover/tip:text-(--accent)">
                          +{rest.length}
                        </span>
                        <Tip>
                          <span className="flex flex-col gap-1.5">
                            {rest.map((t) => (
                              <span key={t} className="flex items-center gap-2">
                                <StackIcon name={t} size="0.7rem" />
                                {t}
                              </span>
                            ))}
                          </span>
                        </Tip>
                      </span>
                    )}

                    <span className="sr-only">{p.stack.join(", ")}</span>
                  </span>

                  <span
                    className="pointer-events-none absolute right-2 top-2 rounded-[3px] px-2 py-0.5 font-mono text-xs font-medium transition-opacity duration-1000 ease-in-out group-has-[.pj-reveal:hover]:opacity-0"
                    style={{
                      color: roleInk,
                      backgroundColor: `color-mix(in srgb, ${C.surface} 92%, transparent)`,
                    }}
                  >
                    {p.role}
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-4 pt-3 pb-3.5">
                  <span className="font-mono text-xs text-muted">{p.year}</span>

                  <div className="mt-1 flex items-start justify-between gap-2.5">
                    <h3 className="font-poppins-sans text-base font-medium text-foreground m-0">
                      {p.title}
                    </h3>

                    <span className="flex shrink-0 items-center gap-2 pt-0.5">
                      <a
                        href={linkHref(p.repo)}
                        target="_blank"
                        rel="noreferrer"
                        title={linkText(p.repo)}
                        aria-label={`${p.title} - source on GitHub`}
                        className="stack-mark"
                        style={{ ["--accent" as string]: roleInk }}
                      >
                        <span
                          className="stack-logo [--size:0.95rem]"
                          aria-hidden="true"
                          style={{ ["--ico" as string]: "url(/assets/icons/github.svg)" }}
                        />
                      </a>

                      <a
                        href={linkHref(p.demo)}
                        target="_blank"
                        rel="noreferrer"
                        title={linkText(p.demo)}
                        aria-label={`${p.title} - live demo`}
                        className="stack-mark [color:var(--muted-color)] hover:[color:var(--accent)]"
                        style={{ ["--accent" as string]: roleInk }}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12.2,8.4 C12.4,10.4 12.5,12.2 12.3,13.2 C9.4,13.6 4.6,13.5 1.9,13.1 C1.5,10.4 1.5,5.4 1.8,2.6 C3.6,2.3 5.4,2.3 7.1,2.4" />
                          <path d="M8.6,7.2 C10.0,5.7 11.6,4.1 13.2,2.5" />
                          <path d="M9.3,2.2 C10.6,2.1 12.1,2.1 13.3,2.3 C13.4,3.5 13.4,4.9 13.3,6.2" />
                        </svg>
                      </a>
                    </span>
                  </div>

                  <p className="mt-2 mb-0 font-poppins-sans text-sm leading-[1.75] text-muted line-clamp-3">
                    {p.desc}
                  </p>
                </div>
              </div>
            </CardShell>
          );
        })}

        {visible.length === 0 && (
          <div className="flex h-90 flex-col items-center justify-center gap-3 sm:col-span-2">
            <svg
              width="48"
              height="44"
              viewBox="0 0 48 44"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted opacity-60"
              aria-hidden="true"
            >
              {/* badan kotak */}
              <path d="M11.2,19.6 C10.9,25.6 11.6,32.1 12.6,36.3 C19.6,37.5 28.6,37.5 35.6,36.3 C36.6,32.1 37.2,25.6 36.9,19.6" />
              {/* tepi dalam - ini yang bikin kotaknya terbaca kosong, bukan pejal */}
              <path d="M11,19.7 C17,21 31,21 37.1,19.7" />
              {/* dua tutup yang terbuka ke luar */}
              <path d="M11.1,19.5 C9.4,17.3 8.1,15 7.3,12.8 C9.9,11.9 13,11.6 15.7,11.9" />
              <path d="M37,19.5 C38.7,17.3 40,15 40.8,12.8 C38.2,11.9 35.1,11.6 32.4,11.9" />
              {/* tiga goresan kecil di atasnya: isyarat "tidak ada apa-apa" */}
              <path d="M20.4,7.2 C20,5.9 19.9,4.7 20,3.8" />
              <path d="M24.1,6.6 C24.1,5.3 24,4.3 24,3.5" />
              <path d="M27.8,7.3 C28.2,6 28.5,4.9 28.8,4.1" />
            </svg>
            <p className="mb-0 font-mono text-xs text-muted">
              <span className="text-red">./</span>nothing here yet for this filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
