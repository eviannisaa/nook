"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { AboutDoodles, AboutPageDoodles } from "@/components/AboutDoodles";
import { GithubPanel } from "@/components/GithubPanel";
import { EducationTimeline } from "@/components/EducationTimeline";
import { WorkHighlight } from "@/components/WorkHighlight";
import { ProjectsHighlight } from "@/components/ProjectsHighlight";
import { PolaroidStack } from "@/components/PolaroidStack";

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

export default function About() {
  const { theme } = useTheme();

  function Cursor() {
    return (
      <span
        style={{
          display: "inline-block",
          width: 2,
          height: "1.1em",
          backgroundColor: C.muted,
          verticalAlign: "text-bottom",
          marginLeft: 2,
          animation: "blink 1s step-end infinite",
        }}
      />
    );
  }

  function Typing({ text, speed = 50 }: { text: string; speed?: number }) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    useEffect(() => {
      let i = 0;
      const iv = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          setDone(true);
          clearInterval(iv);
        }
      }, speed);
      return () => clearInterval(iv);
    }, [text, speed]);
    return (
      <span style={{ color: C.green }}>
        {displayed}
        {!done && <Cursor />}
      </span>
    );
  }

  return (
    <div className="relative mt-8" style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
      <AboutPageDoodles />
      <div className="px-6 pt-12 pb-12 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          {/* <span className="font-mono text-[0.72rem] text-muted">// 01</span> */}
          <h1 className="font-caveat text-[clamp(2rem,4vw,2.8rem)] font-bold text-foreground m-0">
            About Me
          </h1>

          {/* <div className="flex-1 h-px mt-2" style={{ backgroundColor: C.border }} /> */}
        </div>

        {/* <p
          className={`font-mono text-xs sm:text-sm text-green ${theme === "dark" ? "opacity-[0.7]" : "opacity-100"}`}
        >
          <Typing text="# who i am, what i do, how i got here" speed={90} />
        </p> */}
      </div>

      <div className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="relative grid md:grid-cols-2 gap-12 mb-10">
          <AboutDoodles />

          <div className="flex flex-col gap-6">
            <div className="sm:pt-8 pb-2 pl-1 w-full">
              <PolaroidStack>
                <div className="polaroid m-auto">
                  <div className="polaroid-photo" style={{ aspectRatio: "1000 / 1108" }}>
                    <img
                      src="/assets/images/foto.jpg"
                      alt="Evi Nur Annisa"
                      width={1000}
                      height={1108}
                    />
                  </div>
                  <div className="polaroid-caption flex gap-1">
                    <svg
                      className="polaroid-scribble"
                      viewBox="0 0 78 18"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3,13 C7,4 11,4 12,10 C13,16 16,16 18,9 C20,3 23,3 24,10 C25,16 28,15 30,9 C33,2 37,3 38,10 C39,15 43,15 46,9 C50,2 56,3 58,9 C60,14 64,14 68,8 C70,5 73,5 75,7"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.2"
                      />
                    </svg>
                  </div>
                </div>
              </PolaroidStack>
            </div>
          </div>

          {/* bio + facts */}
          <div className="flex flex-col gap-2 sm:gap-4">
            <div>
              <div className="text-xl sm:text-2xl font-caveat font-bold tracking-[0.080em] text-foreground">
                Evi Nur Annisa
              </div>
              <div className="text-[10px] sm:text-xs font-poppins text-muted font-normal tracking-[0.018em]">
                Software Engineer
              </div>
            </div>
            <p className="about-fx font-normal! text-xs sm:text-sm font-poppins leading-[1.8] tracking-[0.012em] text-muted">
              Hello! I'm <span className="text-foreground/90 font-medium">Evi</span>. I am a
              Software Engineer with 2+ years of experience in web development, with a passion for
              exploring new ideas and staying curious about new technologies.{" "}
              <span className="block my-2 sm:my-4">
                {" "}
                I'm always learning, building, and growing through every project. I have experience
                across projects in{" "}
                <span className="text-foreground/90 font-medium">
                  banking, geospatial, and carbon certification
                </span>
                .{" "}
              </span>{" "}
              <span className="block">
                {" "}
                Strong eye for UI details, write clean code, and care about usability. Take a moment
                to explore the resume and see what fun things have been built. Thanks for stopping
                by!
              </span>
            </p>
          </div>
        </div>

        <div className="mt-10 sm:mt-20">
          <EducationTimeline />
        </div>

        <div className="mt-10 sm:mt-12">
          <WorkHighlight />
        </div>

        <div className="mt-10 sm:mt-14">
          <ProjectsHighlight />
        </div>

        {/* <DesignHighlight /> */}

        <div className="mt-12 sm:mt-20">
          <GithubPanel />
        </div>

        {/* <div className="mt-12 sm:mt-16">
          <SkillList groups={skillGroups} chapter="// 06" />
        </div> */}
      </div>
    </div>
  );
}
