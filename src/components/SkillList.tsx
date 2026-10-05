"use client";

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

const ROW_GAP = 14;

export function SkillList({
  groups,
  chapter,
  title = "Tools & Tech",
}: {
  groups: Group[];
  chapter?: string;
  title?: string;
}) {
  return (
    <div>
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
        {groups.map((g) => {
          const items = g.items.filter(Boolean);

          return (
            <div key={g.label} className="sl-col">
              <h3 className="text-[0.92rem] font-semibold text-foreground leading-[1.2] mb-[1.1rem] font-poppins-sans">
                {g.label}
              </h3>

              <ul
                className="sl-list grid grid-cols-2 sm:grid-cols-1 m-0 p-0 list-none"
                style={{ gap: ROW_GAP, ["--row-gap" as string]: `${ROW_GAP}px` }}
              >
                {items.map((name) => (
                  <li key={name} className="flex items-center gap-2">
                    <span className="sl-branch" aria-hidden="true" />
                    {/* {ICON[name] ? (
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
                    )} */}
                    <span className="text-xs sm:text-[0.84rem] text-muted leading-[1.4] font-poppins-sans">
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
