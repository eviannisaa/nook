"use client";

import { useTheme } from "@/components/ThemeProvider";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { FloatingContacts } from "@/components/FloatingContacts";
import { SideMenu } from "@/components/SideMenu";

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

const navItems = [
  { href: "/", label: "home", exact: true },
  { href: "/about", label: "about" },
  { href: "/projects", label: "projects" },
  { href: "/writing", label: "writing" },
];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hoverResume, setHoverResume] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div
      className="bg-background min-h-screen"
      style={{
        transition: "background-color 0.2s ease",
      }}
    >
      <nav
        /* `transition-all` diganti daftar properti yang memang berubah: yang
           berganti saat menggulir cuma latar dan garis bawahnya, sedangkan
           `all` ikut menyertakan backdrop-filter dan properti tata letak - dan
           itu yang bikin navbar terasa menyusul, bukan seiring, dengan
           halamannya. */
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color] duration-300 border-b ${
          !isHome && scrolled ? "border-border" : "border-transparent"
        }`}
        style={{
          backgroundColor: isHome
            ? "transparent"
            : scrolled
              ? "var(--nav-bg-scrolled)"
              : "var(--nav-bg)",
          backdropFilter: isHome ? "none" : "blur(10px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-3 flex items-center justify-between gap-2">
          <a
            href="#"
            className="sketch relative shrink-0 py-2 px-2.75 no-underline"
            style={{
              // @ts-expect-error -- custom property dipakai oleh .sketch
              "--frame": hoverResume ? C.orange : C.border,
              "--frame-fill": "transparent",
              transform: hoverResume ? "rotate(0deg)" : "rotate(-1.5deg)",
              borderRadius: 5,
              boxShadow: hoverResume
                ? theme === "dark"
                  ? "0 5px 12px -5px rgba(0, 0, 0, 0.55)"
                  : "0 5px 12px -5px rgba(122, 106, 85, 0.45)"
                : theme === "dark"
                  ? "0 2px 6px -3px rgba(0, 0, 0, 0.4)"
                  : "0 2px 6px -3px rgba(122, 106, 85, 0.3)",
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={() => setHoverResume(true)}
            onMouseLeave={() => setHoverResume(false)}
          >
            <svg className="frame" preserveAspectRatio="none" aria-hidden="true">
              <rect
                x="3"
                y="3"
                style={{ width: "calc(100% - 6px)", height: "calc(100% - 6px)" }}
                strokeWidth="1.6"
                strokeDasharray="8 3 5 2 9 4"
                strokeLinecap="round"
                rx="3"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="6" cy="6" r="1.5" opacity="0.4" />
              <circle cy="6" r="1.5" style={{ cx: "calc(100% - 6px)" }} opacity="0.4" />
              <circle cx="6" r="1.5" style={{ cy: "calc(100% - 6px)" }} opacity="0.4" />
              <circle
                r="1.5"
                style={{ cx: "calc(100% - 6px)", cy: "calc(100% - 6px)" }}
                opacity="0.4"
              />
            </svg>
            <span
              className="inner text-xs font-mono flex-row! items-center font-medium whitespace-nowrap gap-1.25"
              style={{
                color: hoverResume ? C.fg : C.muted,
                transition: "color 0.18s ease",
              }}
            >
              <svg
                width="11"
                height="12"
                viewBox="0 0 11 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5.5,1 C5.3,3 5.6,5.4 5.5,7.4" />
                <path d="M2.6,5.2 C3.6,6.2 4.7,7.2 5.5,7.8 C6.2,7.1 7.2,6.1 8.4,5.1" />
                <path d="M1.4,10.6 C4,11.1 7.4,11 9.7,10.5" />
              </svg>
              resume
            </span>
          </a>

          <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
            <span className="hidden sm:flex sm:mr-40 lg:mr-38 xl:mr-0">
              <ThemeSwitch />
            </span>
          </div>
        </div>
      </nav>

      {/* page content */}
      <main>{children}</main>

      <SideMenu />
      <FloatingContacts />

      {/* <Footer path={pathname} /> */}
    </div>
  );
}
