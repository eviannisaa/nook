import { useState, useEffect } from "react";
import { Link } from "react-router";

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

function SketchBorder({
     className = "",
     children,
     color = C.border,
     fill = "transparent",
}: {
     className?: string;
     children?: React.ReactNode;
     color?: string;
     fill?: string;
}) {
     return (
          <div className={`relative ${className}`}>
               <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
               >
                    <rect
                         x="2"
                         y="2"
                         width="calc(100% - 4px)"
                         height="calc(100% - 4px)"
                         fill={fill}
                         stroke={color}
                         strokeWidth="1.5"
                         strokeDasharray="7 3 4 2 8 3"
                         strokeLinecap="round"
                         rx="3"
                         vectorEffect="non-scaling-stroke"
                    />
                    <circle cx="5" cy="5" r="1.5" fill={color} opacity="0.6" />
                    <circle
                         cx="calc(100% - 5px)"
                         cy="5"
                         r="1.5"
                         fill={color}
                         opacity="0.6"
                    />
                    <circle
                         cx="5"
                         cy="calc(100% - 5px)"
                         r="1.5"
                         fill={color}
                         opacity="0.6"
                    />
                    <circle
                         cx="calc(100% - 5px)"
                         cy="calc(100% - 5px)"
                         r="1.5"
                         fill={color}
                         opacity="0.6"
                    />
               </svg>
               {children}
          </div>
     );
}

function TermWindow({
     title,
     children,
     className = "",
}: {
     title: string;
     children: React.ReactNode;
     className?: string;
}) {
     return (
          <div
               className={`rounded-md overflow-hidden ${className}`}
               style={{
                    backgroundColor: C.surface,
                    border: `1px solid ${C.border}`,
               }}
          >
               <div
                    className="flex items-center gap-2 px-4 py-2.5"
                    style={{
                         backgroundColor: C.surface2,
                         borderBottom: `1px solid ${C.border}`,
                    }}
               >
                    <div className="flex gap-1.5">
                         <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: "#ff5f57" }}
                         />
                         <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: "#febc2e" }}
                         />
                         <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: "#28c840" }}
                         />
                    </div>
                    <span
                         className="flex-1 text-center"
                         style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.68rem",
                              color: C.muted,
                         }}
                    >
                         {title}
                    </span>
               </div>
               {children}
          </div>
     );
}

function Cursor() {
     return (
          <span
               style={{
                    display: "inline-block",
                    width: 2,
                    height: "1.1em",
                    backgroundColor: C.green,
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
          <span style={{ color: C.fg }}>
               {displayed}
               {!done && <Cursor />}
          </span>
     );
}

function LineNumbers({ count }: { count: number }) {
     return (
          <div
               className="select-none flex flex-col items-end pr-4 shrink-0"
               style={{ minWidth: "2.2rem" }}
          >
               {Array.from({ length: count }, (_, i) => (
                    <span
                         key={i}
                         style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.68rem",
                              color: C.muted,
                              lineHeight: "1.75rem",
                         }}
                    >
                         {String(i + 1).padStart(2, " ")}
                    </span>
               ))}
          </div>
     );
}

const codeLines = [
     [{ c: C.muted, t: "// portfolio.go" }],
     [],
     [
          { c: C.red, t: "package" },
          { c: C.fg, t: " main" },
     ],
     [],
     [
          { c: C.red, t: "type " },
          { c: C.orange, t: "Developer " },
          { c: C.red, t: "struct" },
          { c: C.fg, t: " {" },
     ],
     [
          { c: C.fg, t: "  Role      " },
          { c: C.teal, t: '"Full-Stack Engineer"' },
     ],
     [
          { c: C.fg, t: "  Frontend  " },
          { c: C.teal, t: '"Next.js · Vue.js · MapLibre"' },
     ],
     [
          { c: C.fg, t: "  Backend   " },
          { c: C.teal, t: '"Golang · Express · REST"' },
     ],
     [
          { c: C.fg, t: "  Databases " },
          { c: C.teal, t: '"PostgreSQL · MongoDB"' },
     ],
     [
          { c: C.fg, t: "  Maps      " },
          { c: C.teal, t: '"MapLibre · GeoJSON · Places"' },
     ],
     [
          { c: C.fg, t: "  Available " },
          { c: C.orange, t: "true" },
     ],
     [{ c: C.fg, t: "}" }],
     [],
     [
          { c: C.purple, t: "func " },
          { c: C.blue, t: "main" },
          { c: C.fg, t: "() {" },
     ],
     [
          { c: C.fg, t: "  fmt." },
          { c: C.blue, t: "Println" },
          { c: C.fg, t: "(" },
          { c: C.teal, t: '"Let\'s build."' },
          { c: C.fg, t: ")" },
     ],
     [{ c: C.fg, t: "}" }],
];

const recentActivity = [
     {
          time: "2h ago",
          msg: "Pushed to",
          repo: "geotrak/frontend",
          color: C.teal,
     },
     {
          time: "1d ago",
          msg: "Merged PR",
          repo: "nexus-saas/api",
          color: C.green,
     },
     {
          time: "3d ago",
          msg: "Deployed",
          repo: "storevault/service",
          color: C.purple,
     },
     { time: "1w ago", msg: "Released", repo: "citynav/v2.1.0", color: C.blue },
];

export function Home() {
     return (
          <section
               className="min-h-screen flex items-center relative overflow-hidden px-6 py-16"
               style={{ backgroundColor: C.bg }}
          >
               {/* grid bg */}
               <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                         backgroundImage: `linear-gradient(${C.border}22 1px,transparent 1px),linear-gradient(90deg,${C.border}22 1px,transparent 1px)`,
                         backgroundSize: "40px 40px",
                    }}
               />

               {/* doodle floaters */}
               <svg
                    className="absolute top-24 right-14 opacity-50 float pointer-events-none"
                    width="52"
                    height="52"
                    viewBox="0 0 52 52"
                    fill="none"
               >
                    <path
                         d="M26,3 L28,20 L44,16 L31,27 L40,43 L26,33 L12,43 L21,27 L8,16 L24,20 Z"
                         stroke={C.green}
                         strokeWidth="1.2"
                         fill="rgba(63,185,80,0.08)"
                         strokeLinejoin="round"
                    />
               </svg>
               <svg
                    className="absolute bottom-24 left-16 opacity-30 float pointer-events-none"
                    width="70"
                    height="70"
                    viewBox="0 0 70 70"
                    fill="none"
               >
                    <path
                         d="M35,5 C52,4 66,16 66,35 C66,54 52,65 35,65 C18,65 4,53 4,35 C4,17 18,5 35,5 Z"
                         stroke={C.purple}
                         strokeWidth="1.5"
                         strokeDasharray="5 3"
                         fill="none"
                    />
               </svg>

               <div className="max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
                    {/* ── left ── */}
                    <div>
                         {/* prompt */}
                         <div
                              className="flex items-center gap-2 mb-5"
                              style={{
                                   fontFamily: "'JetBrains Mono', monospace",
                                   fontSize: "0.82rem",
                              }}
                         >
                              <span style={{ color: C.green }}>➜</span>
                              <span style={{ color: C.blue }}>~/portfolio</span>
                              <span style={{ color: C.muted }}>(main)</span>
                              <span style={{ color: C.fg }}>$</span>
                              <Typing text="whoami" speed={90} />
                         </div>

                         {/* avatar + name */}
                         <div className="flex items-center gap-4 mb-5">
                              <div
                                   className="relative shrink-0"
                                   style={{ width: 60, height: 60 }}
                              >
                                   <svg
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        viewBox="0 0 60 60"
                                        fill="none"
                                   >
                                        <path
                                             d="M30,2 C48,1 58,13 58,30 C58,47 47,58 30,58 C13,58 2,47 2,30 C2,13 12,2 30,2 Z"
                                             stroke={C.green}
                                             strokeWidth="1.5"
                                             strokeDasharray="5 3"
                                             strokeLinecap="round"
                                             fill="none"
                                        />
                                   </svg>
                                   <img
                                        src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&auto=format"
                                        alt="Profile"
                                        style={{
                                             width: "100%",
                                             height: "100%",
                                             borderRadius: "50%",
                                             objectFit: "cover",
                                             filter: "grayscale(15%) contrast(1.05)",
                                             border: `2px solid ${C.surface2}`,
                                        }}
                                   />
                                   <span
                                        className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 animate-pulse"
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
                                             lineHeight: 1.1,
                                        }}
                                   >
                                        Evi Nur Annisa
                                   </div>
                                   <div
                                        style={{
                                             fontFamily:
                                                  "'JetBrains Mono', monospace",
                                             fontSize: "0.64rem",
                                             color: C.muted,
                                        }}
                                   >
                                        full-stack engineer · map specialist
                                   </div>
                              </div>
                         </div>

                         {/* headline */}
                         <h1
                              style={{
                                   fontFamily: "'Caveat', cursive",
                                   fontSize: "clamp(2.6rem,6vw,4rem)",
                                   fontWeight: 700,
                                   color: C.fg,
                                   lineHeight: 1.05,
                                   marginBottom: "0.75rem",
                              }}
                         >
                              Full-Stack
                              <br />
                              <span style={{ color: C.green }}>Engineer</span>
                              {" & "}
                              <br />
                              <span style={{ color: C.purple }}>
                                   Map Specialist
                              </span>
                         </h1>

                         <p
                              style={{
                                   fontFamily: "'Inter', sans-serif",
                                   fontSize: "0.88rem",
                                   lineHeight: "1.8",
                                   color: C.muted,
                                   maxWidth: "390px",
                                   marginBottom: "1.75rem",
                              }}
                         >
                              Building geospatial platforms, REST APIs, and
                              micro-frontend architectures — Go on the server,
                              Next.js &amp; Vue on the client, MapLibre on the
                              map.
                         </p>

                         {/* status */}
                         <div
                              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5"
                              style={{
                                   border: `1px solid ${C.green}40`,
                                   borderRadius: "4px",
                                   backgroundColor: "rgba(63,185,80,0.06)",
                                   fontFamily: "'JetBrains Mono', monospace",
                                   fontSize: "0.68rem",
                                   color: C.green,
                              }}
                         >
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                              status: open_to_work = true
                         </div>

                         {/* CTA */}
                         <div className="flex flex-wrap gap-3 mb-8">
                              <Link
                                   to="/projects"
                                   className="transition-all duration-200 hover:-translate-y-0.5"
                                   style={{
                                        fontFamily:
                                             "'JetBrains Mono', monospace",
                                        fontSize: "0.78rem",
                                        fontWeight: 600,
                                        padding: "9px 20px",
                                        backgroundColor: C.green,
                                        color: "#0d1117",
                                        borderRadius: "4px",
                                        textDecoration: "none",
                                   }}
                              >
                                   $ view projects
                              </Link>
                              <Link
                                   to="/chat"
                                   className="transition-all duration-200 hover:-translate-y-0.5"
                                   style={{
                                        fontFamily:
                                             "'JetBrains Mono', monospace",
                                        fontSize: "0.78rem",
                                        fontWeight: 600,
                                        padding: "9px 20px",
                                        backgroundColor: "transparent",
                                        color: C.fg,
                                        borderRadius: "4px",
                                        textDecoration: "none",
                                        border: `1px solid ${C.border}`,
                                   }}
                                   onMouseEnter={(e) =>
                                        (e.currentTarget.style.borderColor =
                                             C.muted)
                                   }
                                   onMouseLeave={(e) =>
                                        (e.currentTarget.style.borderColor =
                                             C.border)
                                   }
                              >
                                   💬 live chat
                              </Link>
                         </div>

                         {/* socials */}
                         <div className="flex gap-2 flex-wrap">
                              {["GitHub", "GitLab", "LinkedIn"].map((s) => (
                                   <a
                                        key={s}
                                        href="#"
                                        style={{
                                             fontFamily:
                                                  "'JetBrains Mono', monospace",
                                             fontSize: "0.66rem",
                                             padding: "3px 9px",
                                             border: `1px solid ${C.border}`,
                                             borderRadius: "3px",
                                             color: C.muted,
                                             textDecoration: "none",
                                             transition: "all 0.15s",
                                        }}
                                        onMouseEnter={(e) => {
                                             e.currentTarget.style.color =
                                                  C.green;
                                             e.currentTarget.style.borderColor =
                                                  C.green;
                                        }}
                                        onMouseLeave={(e) => {
                                             e.currentTarget.style.color =
                                                  C.muted;
                                             e.currentTarget.style.borderColor =
                                                  C.border;
                                        }}
                                   >
                                        ↗ {s}
                                   </a>
                              ))}
                         </div>
                    </div>

                    {/* ── right ── */}
                    <div className="flex flex-col gap-4">
                         <TermWindow title="portfolio.go">
                              <div
                                   className="p-4 flex overflow-x-auto"
                                   style={{
                                        fontFamily:
                                             "'JetBrains Mono', monospace",
                                        fontSize: "0.68rem",
                                        lineHeight: "1.75rem",
                                   }}
                              >
                                   <LineNumbers count={codeLines.length} />
                                   <div className="flex-1">
                                        {codeLines.map((line, i) => (
                                             <div
                                                  key={i}
                                                  style={{
                                                       whiteSpace: "nowrap",
                                                  }}
                                             >
                                                  {line.length === 0 ? (
                                                       <>&nbsp;</>
                                                  ) : (
                                                       line.map((tok, j) => (
                                                            <span
                                                                 key={j}
                                                                 style={{
                                                                      color: tok.c,
                                                                 }}
                                                            >
                                                                 {tok.t}
                                                            </span>
                                                       ))
                                                  )}
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         </TermWindow>

                         {/* recent activity */}
                         <TermWindow title="git log --oneline">
                              <div className="p-3">
                                   {recentActivity.map((a, i) => (
                                        <div
                                             key={i}
                                             className="flex items-center gap-3 py-1.5"
                                             style={{
                                                  borderBottom:
                                                       i <
                                                       recentActivity.length - 1
                                                            ? `1px solid ${C.border}`
                                                            : "none",
                                             }}
                                        >
                                             <span
                                                  style={{
                                                       fontFamily:
                                                            "'JetBrains Mono', monospace",
                                                       fontSize: "0.6rem",
                                                       color: C.muted,
                                                       minWidth: "3.5rem",
                                                  }}
                                             >
                                                  {a.time}
                                             </span>
                                             <span
                                                  style={{
                                                       fontFamily:
                                                            "'JetBrains Mono', monospace",
                                                       fontSize: "0.65rem",
                                                       color: C.muted,
                                                  }}
                                             >
                                                  {a.msg}
                                             </span>
                                             <span
                                                  style={{
                                                       fontFamily:
                                                            "'JetBrains Mono', monospace",
                                                       fontSize: "0.65rem",
                                                       color: a.color,
                                                  }}
                                             >
                                                  → {a.repo}
                                             </span>
                                        </div>
                                   ))}
                              </div>
                         </TermWindow>
                    </div>
               </div>
          </section>
     );
}
