"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { STAR, DOTS } from "@/components/AboutDoodles";

const ICON: Record<string, string> = {
  "Next.js": "nextdotjs",
  "Vue.js": "vuedotjs",
  TypeScript: "typescript",
  JavaScript: "javascript",
  "TanStack Query": "reactquery",
  "Tailwind CSS": "tailwindcss",
  "Google Maps JS API": "googlemaps",
  Jest: "jest",
  Golang: "go",
  "Express.js": "express",
  JWT: "jsonwebtokens",
  "Auth & Authorization": "auth0",
  Swagger: "swagger",
  Postman: "postman",
  PostgreSQL: "postgresql",
  MongoDB: "mongodb",
  "Prisma ORM": "prisma",
  Docker: "docker",
  MinIO: "minio",
  Nginx: "nginx",
  Jenkins: "jenkins",
  Git: "git",
  GitHub: "github",
  GitLab: "gitlab",
};

type Group = { label: string; items: string[] };

/* `chapter` dan `title` opsional supaya komponen ini bisa dipakai di dua tempat
   dengan peran berbeda.

   Di /about ia satu bab dari rangkaian bercerita, jadi butuh penanda "// 06".
   Di /experience tidak ada bab sama sekali - halaman itu cuma punya satu judul
   utama - jadi penanda bab di sana akan menunjuk urutan yang tidak ada.

   `chapter` sengaja TANPA nilai bawaan: kalau bawaannya "// 06", tiap pemakai
   baru harus ingat mematikannya, dan yang lupa akan menampilkan nomor bab yang
   salah. Dibiarkan kosong, yang perlu bertindak hanya pemakai yang memang punya
   bab. */
export function SkillList({
  groups,
  chapter,
  title = "Tools & Tech",
}: {
  groups: Group[];
  chapter?: string;
  title?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const draws = self.selector!(".sl-draw") as SVGPathElement[];

      draws.forEach((d) => {
        const len = d.getTotalLength();
        gsap.set(d, { strokeDasharray: len, strokeDashoffset: len });
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(draws, { strokeDashoffset: 0 });
        return;
      }

      const tl = gsap
        .timeline({ paused: true })
        /* Kolom teks (.sl-col) tidak lagi dianimasikan; tinggal marka doodle. */
        .to(draws, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut", stagger: 0.06 })
        .add(() => {
          gsap.to(self.selector!(".sl-mark"), {
            y: -5,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: { each: 0.35, from: "random" },
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
  }, [groups]);

  return (
    <div ref={rootRef} className="relative">
      <svg
        className="sl-mark hidden xl:block absolute pointer-events-none bottom-36 -left-22 w-5"
        viewBox="0 0 40 40"
        fill="none"
        stroke="var(--muted-color)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
        aria-hidden="true"
      >
        <path className="sl-draw" d={STAR} />
      </svg>
      <svg
        className="sl-mark hidden xl:block absolute pointer-events-none bottom-2 -right-22 w-6"
        viewBox="0 0 40 20"
        fill="none"
        stroke="var(--teal-color)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
        aria-hidden="true"
      >
        {DOTS.map((d, i) => (
          <path key={i} className="sl-draw" d={d} />
        ))}
      </svg>
      <div className="flex gap-2.5 items-center mb-2">
        {chapter && (
          <div className="font-mono text-[0.72rem] text-muted opacity-[0.65]">{chapter}</div>
        )}
        <div className="font-caveat text-xl sm:text-2xl font-bold text-foreground tracking-[0.080em]">
          {title}
        </div>
      </div>
      <p className="mb-4 sm:mb-6 lg:max-w-160 text-xs sm:text-sm text-muted leading-[1.8] font-poppins-sans tracking-[0.012em]">
        Tools and technologies I’ve used at work, in personal projects, and along the way.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10 items-start">
        {groups.map((g) => (
          <div key={g.label} className="sl-col">
            <h3 className="text-xs sm:text-sm font-medium text-foreground leading-[1.2] mb-[1.1rem] font-poppins-sans">
              {g.label}
            </h3>

            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-3.5 m-0 p-0 list-none">
              {g.items.filter(Boolean).map((name) => (
                <li key={name} className="flex items-center gap-3">
                  {ICON[name] ? (
                    /* `sl-ico` menyembunyikannya di bawah sm; aturannya di
                       src/index.css, bukan utility Tailwind — lihat komentar di
                       sana soal urutan cascade terhadap .stack-logo. */
                    <span
                      className="stack-logo shrink-0 sl-ico"
                      aria-hidden="true"
                      style={{
                        ["--ico" as string]: `url(/assets/icons/${ICON[name]}.svg)`,
                        ["--size" as string]: "1.15rem",
                      }}
                    />
                  ) : (
                    <span
                      className="sl-ico shrink-0 flex items-center justify-center w-[1.15rem] h-[1.15rem]"
                      aria-hidden="true"
                    >
                      <span className="w-[0.32rem] h-[0.32rem] sm:w-[0.42rem] sm:h-[0.42rem] rounded-full border-[1.5px] border-muted opacity-[0.55]" />
                    </span>
                  )}
                  <span className="text-xs sm:text-[0.84rem] text-muted leading-[1.4] font-poppins-sans">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
