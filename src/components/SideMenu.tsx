"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  FolderGit2,
  Handshake,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import gsap from "gsap";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { useTheme } from "@/components/ThemeProvider";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  ink: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "connect with me",
    exact: true,
    ink: "var(--green-color)",
    icon: <Handshake size={15} strokeWidth={2.2} />,
  },
  {
    href: "/about",
    label: "about",
    ink: "var(--purple-color)",
    icon: <User size={15} strokeWidth={2.2} />,
  },
  {
    href: "/experience",
    label: "experience",
    ink: "var(--amber-color)",
    icon: <Briefcase size={15} strokeWidth={2.2} />,
  },
  {
    href: "/projects",
    label: "projects",
    ink: "var(--blue-color)",
    icon: <FolderGit2 size={15} strokeWidth={2.2} />,
  },
  {
    href: "/writing",
    label: "fun",
    ink: "var(--teal-color)",
    icon: <Sparkles size={15} strokeWidth={2.2} />,
  },
];

const DRAG_KEY = "side-menu-pos";
const MIN_TOP = 8;
const MIN_BOTTOM = 16;
const GAP = 8;
const SNAP = 44;
const DRAG_THRESHOLD = 4;

type Side = "left" | "right" | "free";
type Place = { x: number; y: number; side: Side; openUp: boolean };

function edgeStyle(side: Side, ink = "var(--border-color)"): React.CSSProperties {
  const line = `1px solid ${ink}`;
  return {
    borderTop: line,
    borderBottom: line,
    borderLeft: side === "left" ? "none" : line,
    borderRight: side === "right" ? "none" : line,
    borderRadius: side === "right" ? "10px 0 0 10px" : side === "left" ? "0 10px 10px 0" : "10px",
  };
}

function DoodleLines() {
  return (
    <svg
      width="15"
      height="12"
      viewBox="0 0 15 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M1.3,2 Q6.5,0.7 13.7,1.8" />
      <path d="M1.6,5.9 Q8,4.8 13.3,6.1" />
      <path d="M1.3,9.8 Q6,8.6 13.6,9.9" />
    </svg>
  );
}

function DoodleX() {
  return (
    <svg
      width="15"
      height="12"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M1.9,1.7 Q7,6.4 11.3,11.4" />
      <path d="M11.3,1.9 Q6.6,6.9 1.7,11.2" />
    </svg>
  );
}

export function SideMenu() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<SVGPathElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<gsap.core.Timeline | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const pathname = usePathname();
  const { theme } = useTheme();

  const side = place?.side ?? "right";
  const openUp = place?.openUp ?? false;

  useEffect(() => setOpen(false), [pathname]);

  const resolve = (rawX: number, rawY: number): Place => {
    const tab = buttonRef.current;
    const tabW = tab?.offsetWidth ?? 0;
    const tabH = tab?.offsetHeight ?? 0;
    const panelH = panelRef.current?.offsetHeight ?? 0;

    const maxX = Math.max(0, window.innerWidth - tabW);
    const maxY = Math.max(MIN_TOP, window.innerHeight - tabH - MIN_BOTTOM);

    let x = Math.min(Math.max(rawX, 0), maxX);
    const y = Math.min(Math.max(rawY, MIN_TOP), maxY);

    let nextSide: Side = "free";
    if (x <= SNAP) {
      x = 0;
      nextSide = "left";
    } else if (x >= maxX - SNAP) {
      x = maxX;
      nextSide = "right";
    }

    const roomBelow = window.innerHeight - MIN_BOTTOM - (y + tabH + GAP);
    return { x, y, side: nextSide, openUp: panelH > 0 && roomBelow < panelH };
  };

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(DRAG_KEY);
    } catch {
      return;
    }
    if (!stored) return;
    try {
      const { x, y } = JSON.parse(stored) as { x: number; y: number };
      if (Number.isFinite(x) && Number.isFinite(y)) setPlace(resolve(x, y));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (place === null) return;
    const onResize = () => setPlace((p) => (p === null ? p : resolve(p.x, p.y)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);

  useEffect(() => {
    const dots = dotsRef.current;
    const arrow = arrowRef.current;
    if (!dots || !arrow) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tl = gsap.timeline();
    tl.to(dots, { strokeDashoffset: -4.6, duration: 0.85, ease: "none", repeat: -1 }, 0).to(
      arrow,
      {
        x: side === "left" ? -4 : 4,
        duration: 1.1,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      },
      0,
    );
    hintRef.current = tl;

    return () => {
      tl.kill();
      hintRef.current = null;
    };
  }, [side]);

  useEffect(() => {
    const tl = hintRef.current;
    if (!tl) return;
    gsap.to(tl, {
      timeScale: dragging ? 0 : 1,
      duration: dragging ? 0.22 : 0.5,
      ease: "power2.out",
      overwrite: true,
    });
  }, [dragging]);

  const rampHint = (fast: boolean) => {
    if (!hintRef.current) return;
    gsap.to(hintRef.current, {
      timeScale: fast ? 2.6 : 1,
      duration: fast ? 0.4 : 1.1,
      ease: fast ? "power2.out" : "power2.inOut",
      overwrite: true,
    });
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const items = panel.querySelectorAll<HTMLElement>("[data-menu-item]");
    const hidden = { autoAlpha: 0, x: side === "left" ? -14 : 14 };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(panel, { autoAlpha: open ? 1 : 0, y: 0 });
      gsap.set(items, { autoAlpha: 1, x: 0 });
      return;
    }

    const tl = gsap.timeline();
    if (open) {
      tl.set(items, hidden)
        .to(panel, { autoAlpha: 1, y: 0, duration: 0.26, ease: "back.out(1.7)" })
        .to(
          items,
          { autoAlpha: 1, x: 0, duration: 0.32, ease: "power3.out", stagger: 0.045 },
          "-=0.15",
        );
    } else {
      tl.to(items, {
        ...hidden,
        duration: 0.12,
        ease: "power2.in",
        stagger: { each: 0.02, from: "end" },
      }).to(
        panel,
        {
          autoAlpha: 0,
          y: openUp ? GAP : -GAP,
          duration: 0.16,
          ease: "power2.in",
        },
        "-=0.05",
      );
    }

    return () => {
      tl.kill();
    };
  }, [open, openUp, side]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const resetPlace = () => {
    setPlace(null);
    try {
      localStorage.removeItem(DRAG_KEY);
    } catch {}
  };

  const onDragStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const next = resolve(e.clientX - d.dx, e.clientY - d.dy);
    if (!d.moved) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (
        Math.abs(next.x - rect.left) < DRAG_THRESHOLD &&
        Math.abs(next.y - rect.top) < DRAG_THRESHOLD
      ) {
        return;
      }
      d.moved = true;
      setDragging(true);
    }
    setPlace(next);
  };

  const onDragEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!d?.moved) return;
    suppressClickRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    try {
      localStorage.setItem(DRAG_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
    } catch {}
  };

  return (
    <div
      ref={rootRef}
      className="fixed right-0 top-3 z-50 flex sm:top-3"
      style={
        place === null ? undefined : { left: place.x, top: place.y, right: "auto", bottom: "auto" }
      }
    >
      <button
        type="button"
        ref={buttonRef}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          setOpen((o) => !o);
        }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        onDoubleClick={resetPlace}
        onMouseEnter={() => rampHint(true)}
        onMouseLeave={() => rampHint(false)}
        title="Click to open the menu, drag to move, double-click to reset"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="side-menu-panel"
        aria-label={open ? "close menu" : "open menu"}
        className={`flex items-center gap-1.5 h-8.5 pl-3 pr-3.5 font-medium text-[0.66rem] font-mono ${open ? "text-foreground bg-surface2" : "text-muted bg-surface"}`}
        style={{
          ...edgeStyle(side),
          boxShadow: "0 3px 10px -4px rgba(0, 0, 0, 0.4)",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none", // supaya drag di layar sentuh tidak men-scroll halaman
          userSelect: "none",
          transition: "background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease",
        }}
      >
        {open ? <DoodleX /> : <DoodleLines />}
      </button>

      <div
        className={`absolute hidden items-center gap-1 sm:flex top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap ${side === "left" ? "left-[calc(100%+4px)] flex-row-reverse" : "right-[calc(100%+4px)] flex-row"} ${dragging ? "opacity-0" : "opacity-75"} transition-opacity duration-200 ease`}
        aria-hidden="true"
      >
        <span
          className={`text-lg font-semibold font-caveat -rotate-6 ${theme === "dark" ? "text-blue" : "text-blue-500"}`}
        >
          {open ? "close menu" : "click menu"}
        </span>

        <span ref={arrowRef} className="flex">
          <svg
            width="30"
            height="16"
            viewBox="0 0 30 16"
            fill="none"
            style={{ transform: side === "left" ? "scaleX(-1)" : undefined }}
          >
            <path
              ref={dotsRef}
              d="M2,12 Q13,2 25,6"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="0.1 4.5"
              className={theme === "dark" ? "stroke-blue" : "stroke-blue-500"}
            />
            <path
              d="M19,2 L25,6 L18,9"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={theme === "dark" ? "stroke-blue" : "stroke-blue-500"}
            />
          </svg>
        </span>
      </div>

      <div
        id="side-menu-panel"
        ref={panelRef}
        className={`absolute flex flex-col overflow-hidden min-w-38 bg-surface py-1.5 px-0 opacity-0 invisible shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] ${side === "left" ? "left-0" : "right-0"} ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{
          [openUp ? "bottom" : "top"]: `calc(100% + ${GAP}px)`,
          ...edgeStyle(side),
        }}
      >
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const lifted = hovered === item.href || isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-menu-item
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => setHovered(item.href)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(item.href)}
              onBlur={() => setHovered(null)}
              className={`flex items-center gap-2 py-2 pl-3 pr-4 font-mono text-sm whitespace-nowrap no-underline ${lifted ? "text-foreground bg-surface2" : "text-muted bg-transparent"} ${isActive ? "font-semibold" : "font-normal"}`}
              style={{
                borderLeft: `2px solid ${isActive ? item.ink : "transparent"}`,
                transition: "all 0.15s ease",
              }}
            >
              <span
                style={{
                  color: lifted ? item.ink : "var(--muted-color)",
                  display: "flex",
                  transition: "color 0.15s ease",
                }}
              >
                {item.icon}
              </span>
              <span>
                <span className="text-red">./</span>
                {item.label}
              </span>
            </Link>
          );
        })}
        <div
          data-menu-item
          className="sm:hidden flex items-center justify-between gap-3 py-2 pl-3 pr-4 mt-1.25 pt-2 border-t border-dashed border-border font-mono text-[0.64rem] text-muted whitespace-nowrap"
        >
          <span className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon size={14} strokeWidth={2.2} />
            ) : (
              <Sun size={14} strokeWidth={2.2} />
            )}
            {theme === "dark" ? "dark" : "light"}
          </span>
          <ThemeSwitch />
        </div>

        {place !== null && (
          <button
            type="button"
            data-menu-item
            onClick={resetPlace}
            className="flex items-center gap-2 py-2 pl-3 pr-4 cursor-pointer mt-1.25 pt-2 bg-none border-t border-dashed border-border rounded-none font-mono text-[0.64rem] text-muted whitespace-nowrap text-left"
            style={{
              borderRight: "none",
              borderBottom: "none",
              borderLeft: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--fg-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-color)";
            }}
          >
            <RotateCcw size={14} strokeWidth={2.2} />
            restore position
          </button>
        )}
      </div>
    </div>
  );
}
