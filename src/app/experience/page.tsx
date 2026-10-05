"use client";

import { SkillList } from "@/components/SkillList";
import { RING } from "@/components/AboutDoodles";
import { Monitor } from "lucide-react";
import React from "react";

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

export const timeline = [
  {
    year: "March 2026 - Current",
    title: "Software Engineer",
    place: "TAN Digital",
    desc: "After that, I joined a TSEL project, working on network analysis using reports from Ookla and Speedtest. It was a different kind of challenge, working with network data and turning those reports into useful insights through the application.",
    skills: [
      "Next.js",
      "TypeScript",
      "TanStack Query",
      "Tailwind CSS",
      "MapLibre GL JS",
      "GeoJSON",
      "RESTful API",
    ],
  },
  {
    year: "Dec 2024 - Feb 2026",
    title: "Frontend Engineer",
    place: "TAN Digital",
    desc: "When I first joined, I started with a project for Mitratel, building data visualizations and geospatial features around tower data. Then came PMT, where I worked on revamping the UI and finding ways to make the application cleaner and easier to use. Moving between these projects gave me a chance to work with different types of products and learn something new each time.",
    skills: [
      "Next.js",
      "TypeScript",
      "TanStack Query",
      "Tailwind CSS",
      "MapLibre GL JS",
      "GeoJSON",
      "Microfrontend",
    ],
  },
  {
    year: "Feb 2023 - Nov 2024",
    title: "Frontend Developer",
    place: "Infosys Solusi Terpadu",
    desc: "This was my first official role as a developer, where I started working on real projects for Bank Jatim and Bank Victoria. I worked on turning designs and requirements into working interfaces, while learning how to build clean and responsive banking applications. It was also my first time working closely with senior developers. Seeing their skills and how they worked made me realize there was still a lot for me to learn, and it pushed me to keep growing. Along the way, I also learned how different roles work together, from designers and developers to QA and other teams, and how everyone plays a part in building a project.",
    skills: [
      "React",
      "TypeScript",
      "JavaScript",
      "Styled Components",
      "RESTful API",
      "JWT",
      "Katalon Studio",
      "GitLab",
    ],
  },
  {
    year: "Oct 2022 - Jan 2023",
    title: "React Js Developer",
    place: "Infosys Solusi Terpadu",
    desc: "I started this journey through a React.js bootcamp that combined learning with a team-based competition for a chance to join the company. For the final challenge, my team worked on a study case called Evil Corps, turning the given requirements into a working web application while learning how to collaborate, solve problems, and build with React.js",
    skills: ["React", "JavaScript", "RESTful API", "Component-Based Architecture", "Git"],
  },
  {
    year: "Feb 2022 - Jul 2022",
    title: "Frontend Developer",
    place: "Media Kreasi Abadi",
    desc: "As part of the MSIB program, I had the opportunity to join Media Kreasi Abadi as a Frontend Developer. I learned React.js and TypeScript by working on a study case based on our own brainstorming and ideas. I worked with the team to turn those ideas into a real web application, while collaborating with backend, UI/UX, and mobile developers. I also met and made friends with people from different parts of Indonesia, which made the experience even more memorable.",
    skills: [
      "Next.js",
      "Golang",
      "Google OAuth 2.0",
      "Prisma ORM",
      "PostgreSQL",
      "Docker",
      "Nginx",
      "Playwright",
    ],
  },
  {
    year: "Sep 2021 - Jan 2022",
    title: "Frontend Developer",
    place: "Geeschool Cendekia Mandiri",
    desc: "This was my first internship, as part of a program from my university. I worked on landing pages for schools while learning the basics of web development with HTML, CSS, and JavaScript. More than the technical side, this was my first experience working on a real project and understanding how work is organized, from receiving tasks to completing them as part of a team.",
    skills: ["Vue.js", "Next.js", "JavaScript", "Google Maps JS API", "Places API"],
  },
  {
    year: "Feb 2021 - Jul 2021",
    title: "Web Programming Practicum Assistant",
    place: "Forum Asisten — Amikom Yogyakarta University",
    desc: "This was my first experience as a teaching assistant, where I helped run web programming practical sessions based on the lecturer’s syllabus. I explained the materials and helped students during the sessions. What made this experience special was receiving good feedback from the students at the end of the semester. It was really nice to know that they enjoyed the sessions and found my help useful.",
    skills: ["React", "JavaScript", "Express.js", "RESTful API", "GeoJSON", "MongoDB"],
  },
];

function groupByPlace(rows: typeof timeline) {
  const out: { place: string; roles: typeof timeline }[] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.place === r.place) last.roles.push(r);
    else out.push({ place: r.place, roles: [r] });
  }
  return out;
}

function placeSpan(roles: typeof timeline) {
  const first = roles[roles.length - 1].year.split(" - ")[0];
  const last = roles[0].year.split(" - ")[1] ?? roles[0].year;
  return `${first} - ${last}`;
}

const PLACE_LOGO: Record<string, string> = {
  "TAN Digital": "/assets/images/logo-tan.webp",
  "Infosys Solusi Terpadu": "/assets/images/ist-logo.png",
  "Media Kreasi Abadi": "/assets/images/logo-mka.png",
  "Geeschool Cendekia Mandiri": "/assets/images/logo-geschool.webp",
  "Forum Asisten — Amikom Yogyakarta University": "/assets/images/forum_asisten_logo.jpeg",
};

const PLACE_LOCATION: Record<string, string> = {
  "TAN Digital": "Jakarta Selatan, Indonesia",
  "Infosys Solusi Terpadu": "Jakarta Selatan, Indonesia",
  "Media Kreasi Abadi": "Jakarta Selatan, Indonesia",
  "Geeschool Cendekia Mandiri": "Jakarta Selatan, Indonesia",
  "Forum Asisten — Amikom Yogyakarta University": "Jakarta Selatan, Indonesia",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

const BADGE = 34;
const RAIL_X = BADGE / 2; // rel sejajar tengah plakat
const ROLE_PAD = 29; // isi jabatan sejajar dengan nama perusahaan di kepala

const DOT = 11; // sisi kotak gambar penanda
const DOT_TOP = 4; // turunnya penanda supaya sejajar tengah baris judul
const DOT_MID = DOT_TOP + DOT / 2; // pusat penanda, tempat rel bermula
const ROLE_GAP = 24; // jarak antar jabatan, dulu `mb-6`

const skillGroups = [
  {
    label: "Frontend & Styling",
    color: C.teal,
    emoji: Monitor,
    items: [
      "Next.js",
      "Vue.js",
      "TypeScript",
      "JavaScript",
      "TanStack Query",
      "Tailwind CSS",
      "Styled Components",
      "MapLibre GL JS",
      "Google Maps JS API",
      "Places API",
      "GeoJSON",
    ],
  },
  {
    label: "Backend & Database",
    color: C.green,
    emoji: Monitor,
    items: [
      "Golang",
      "Express.js",
      "RESTful API",
      "JWT",
      "Auth & Authorization",
      "API Design",
      "Google OAuth 2.0",
      "Swagger",
      "Postman",
      "PostgreSQL",
      "MongoDB",
      "Prisma ORM",
      "ERD",
      "Database Design",
    ],
  },
  {
    label: "Infrastructure & Tools",
    color: C.purple,
    emoji: Monitor,
    items: ["Docker", "MinIO", "Nginx", "Jenkins", "Git", "GitHub", "GitLab"],
  },
  {
    label: "Testing & Architecture",
    color: C.amber,
    emoji: Monitor,
    items: [
      "Jest",
      "Playwright",
      "Katalon Studio",
      "Microfrontend",
      "Component-Based Architecture",
      "Client-Server Architecture",
      "TRD",
      "SDLC",
    ],
  },
];

export default function Experience() {
  const groups = groupByPlace(timeline);

  return (
    <div className="relative mt-8" style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
      <div className="px-6 pt-12 pb-12 max-w-5xl mx-auto">
        <div>
          <h1 className="font-caveat text-[clamp(2rem,4vw,2.8rem)] font-bold text-foreground m-0">
            Work & Stacks
          </h1>
          {/* <p className="font-mono text-[0.7rem] text-muted">
            <span className="text-red">./</span>things i've built · click to expand
          </p> */}
        </div>
        <div className="flex gap-2.5 items-center mb-2 mt-8">
          <div className="font-caveat text-xl sm:text-2xl font-bold text-foreground tracking-[0.080em]">
            Where I&apos;ve Worked
          </div>
        </div>

        <p className="mb-4 sm:mb-6 lg:max-w-160 text-xs sm:text-sm text-muted leading-[1.8] font-poppins-sans tracking-[0.012em]">
          The roles I&apos;ve held, the teams I worked alongside, and the products I helped bring to
          production.
        </p>

        {groups.map((g, gi) => (
          <section key={g.place} className="mb-11 last:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="shrink-0 flex items-center justify-center overflow-hidden rounded-[9px] border border-border bg-surface"
                style={{
                  width: BADGE,
                  height: BADGE,
                }}
              >
                {PLACE_LOGO[g.place] ? (
                  <img
                    className="place-logo"
                    src={PLACE_LOGO[g.place]}
                    alt={g.place}
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                ) : (
                  <span
                    className="font-mono font-semibold tracking-[0.04em] text-muted"
                    style={{
                      fontSize: initials(g.place).length > 2 ? "0.62rem" : "0.72rem",
                    }}
                  >
                    {initials(g.place)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col gap-1">
                  <h2 className="m-0 font-poppins-sans text-sm sm:text-sm text-foreground">
                    {g.place}
                  </h2>
                  {PLACE_LOCATION[g.place] && (
                    <div className="font-mono text-xs text-muted leading-[1.4]">
                      {PLACE_LOCATION[g.place]}
                    </div>
                  )}
                </div>
                <div className="ml-auto self-start text-xs font-poppins-sans text-foreground">
                  {placeSpan(g.roles)}
                </div>
              </div>
            </div>

            <div className="relative" style={{ marginLeft: RAIL_X, paddingLeft: ROLE_PAD }}>
              <span
                aria-hidden="true"
                className="absolute bg-border"
                style={{
                  left: -1,
                  top: DOT_MID,
                  bottom: 0,
                  width: 1,
                }}
              />
              {g.roles.map((t, i) => {
                const top = gi === 0 && i === 0;

                return (
                  <div
                    key={t.year}
                    className="relative"
                    style={{ marginBottom: i < g.roles.length - 1 ? ROLE_GAP : 0 }}
                  >
                    <svg
                      className="absolute overflow-visible"
                      style={{
                        left: -(1 + ROLE_PAD + DOT / 2),
                        top: DOT_TOP,
                        width: DOT,
                        height: DOT,
                      }}
                      viewBox="0 0 11 11"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d={RING}
                        stroke={top ? C.green : C.muted}
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill={top ? C.green : C.muted}
                      />
                    </svg>

                    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                      <span className="text-sm text-foreground font-mono leading-tight opacity-90">
                        {t.title}
                      </span>
                      {g.roles.length > 1 && (
                        <span className="shrink-0 font-mono text-xs text-muted opacity-80">
                          {t.year}
                        </span>
                      )}
                    </div>

                    <p className="m-0 font-poppins-sans text-sm leading-[1.75] tracking-[0.012em] text-muted max-w-155">
                      {t.desc}
                    </p>

                    {t.skills.length > 0 && (
                      <ul className="flex flex-wrap gap-2 m-0 mt-4 p-0 list-none">
                        {t.skills.map((s) => (
                          <li
                            key={s}
                            className="py-1.5 px-3 font-mono text-[0.68rem] leading-none text-muted rounded-ful border border-border bg-transparent"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="mt-14 sm:mt-20">
          <SkillList groups={skillGroups} title="What I Build With" />
        </div>
      </div>
    </div>
  );
}
