"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SendHorizontal, X } from "lucide-react";

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

type Role = "user" | "bot";
interface Message {
  id: number;
  role: Role;
  text: string;
  typing?: boolean;
}

// ─── knowledge base ───────────────────────────────────────────────────────────
const kb: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/halo|hai|hello|hi|hey|selamat/i],
    answer:
      "Halo! 👋 I'm the dev assistant for this portfolio. Ask me anything about background, skills, work experience, or projects!",
  },
  {
    patterns: [/nama|name|siapa|who are you|siapa kamu/i],
    answer:
      "My name is [Your Name] — a Full-Stack Engineer & Map Specialist based in Indonesia. I build geospatial platforms, REST APIs, and micro-frontend architectures.",
  },
  {
    patterns: [/lokasi|location|kota|domisili|where|tinggal/i],
    answer:
      "📍 Based in Indonesia, working remote-first. Open to fully remote opportunities worldwide.",
  },
  {
    patterns: [/pengalaman|experience|berapa lama|how long|tahun/i],
    answer:
      "3+ years of professional experience:\n• 2024 – Senior Frontend at a Geo-Tech startup (MapLibre, Vue.js, microfrontend)\n• 2023 – Fullstack Engineer at a SaaS platform (Next.js + Go + PostgreSQL)\n• 2022 – Frontend Developer at a digital agency\n• 2021 – Started as Junior Dev / Freelance",
  },
  {
    patterns: [/golang|go lang|backend/i],
    answer:
      "Go is my primary backend language. I build REST APIs with clean middleware stacks, JWT auth, Swagger docs, and Dockerised deployments behind Nginx. Proficiency: ~85%.",
  },
  {
    patterns: [/frontend|react|next|vue|javascript|typescript/i],
    answer:
      "Frontend is where I spend most of time:\n• Next.js & Vue.js — primary frameworks (~92%)\n• TypeScript — always\n• TanStack Query — data fetching & caching\n• Tailwind + Styled Components — styling\n• Microfrontend architecture — Vue + React via module federation",
  },
  {
    patterns: [/maplibre|google maps|peta|map|geojson|geospatial|geo|places api/i],
    answer:
      "🗺️ Maps & Geo are my speciality! I've built:\n• Real-time fleet tracking with MapLibre GL JS + GeoJSON\n• Custom vector tile layers & polygon overlays\n• Places API autocomplete for location search\n• PostGIS schemas for geospatial data\nProficiency: MapLibre ~83%, Google Maps API ~80%.",
  },
  {
    patterns: [/database|postgresql|postgres|mongodb|prisma|erd/i],
    answer:
      "Database stack:\n• PostgreSQL — primary, with Prisma ORM for type-safe queries\n• MongoDB — for metadata-heavy services\n• ERD design before writing a single migration\n• Familiar with PostGIS for geospatial extensions",
  },
  {
    patterns: [/docker|devops|jenkins|nginx|cicd|ci\/cd/i],
    answer:
      "DevOps toolkit:\n• Docker — containerise everything, multi-stage builds\n• Nginx — reverse proxy, TLS termination, rate limiting\n• Jenkins — CI/CD pipelines (build → test → deploy)\n• Git + GitHub + GitLab — daily workflow\n• MinIO — S3-compatible object storage",
  },
  {
    patterns: [/testing|jest|playwright|katalon|e2e|unit test/i],
    answer:
      "Testing is non-negotiable:\n• Jest — unit & integration tests\n• Playwright — E2E automation (browser testing)\n• Katalon Studio — regression testing for enterprise clients\nI aim for >80% test coverage on critical paths.",
  },
  {
    patterns: [/arsitektur|architecture|microfrontend|design pattern|sdlc|trd/i],
    answer:
      "Architecture interests:\n• Microfrontend — module federation, cross-team coordination\n• Client-Server Architecture — clear API contracts\n• Component-Based Architecture — reusable, testable UI\n• SDLC & TRD documentation — I write tech docs before coding",
  },
  {
    patterns: [/proyek|project|portofolio|portfolio|what have you built/i],
    answer:
      "Selected projects:\n1. 🗺️ GeoTrack — Fleet mapping (Vue.js + MapLibre + GeoJSON)\n2. 🏙️ CityNav — Geo explorer (Next.js + MapLibre + TanStack Query)\n3. ⚡ Nexus — Multi-tenant SaaS (Next.js + Go + PostgreSQL + Docker)\n4. 🗄️ StoreVault — Media service (Go + MinIO + MongoDB)\n\nCheck the Projects page for details!",
  },
  {
    patterns: [/hire|freelance|kontrak|kerja sama|available|open to work/i],
    answer:
      "✅ Yes, I'm currently open to:\n• Full-time roles (frontend, fullstack, or geo-focused)\n• Freelance projects\n• Geospatial engineering collaborations\n\nResponse time: within 24 hours. Drop a message on the Contact page!",
  },
  {
    patterns: [/skill|kemampuan|technology|tech stack|bisa apa/i],
    answer:
      "Full skill set:\n🖥️ Frontend: Next.js, Vue.js, TypeScript, TanStack Query, Tailwind, Styled Components, MapLibre, Google Maps JS API\n⚙️ Backend: Golang, Express.js, REST API, JWT, OAuth 2.0, Swagger\n🗄️ DB: PostgreSQL, MongoDB, Prisma, ERD\n🐳 DevOps: Docker, Nginx, Jenkins, MinIO, Git\n🧪 Testing: Jest, Playwright, Katalon Studio",
  },
  {
    patterns: [/blog|tulisan|writing|artikel|article/i],
    answer:
      "📝 I write about things I learn on the job:\n• MapLibre & GeoJSON patterns\n• Go REST API design\n• Microfrontend in production\n• Docker + Nginx deployment\n• TanStack Query for map-heavy dashboards\n\nCheck the Writing page!",
  },
  {
    patterns: [/kontak|contact|email|hubungi/i],
    answer:
      "📬 Reach me at: hello@devsketch.io\n⏱ Response time: usually within 24 hours.\nOr just fill out the form — I'll get back to you.",
  },
];

function matchKB(input: string): string {
  const hit = kb.find((k) => k.patterns.some((p) => p.test(input)));
  return (
    hit?.answer ??
    "Hmm, I'm not sure about that specific topic. Try asking about my skills, projects, experience, maps/geo work, or availability! 🤔"
  );
}

const SUGGESTIONS = [
  "What is your tech stack?",
  "Tell me about your map projects",
  "Are you available for hire?",
  "How much experience do you have?",
  "What is your Go experience?",
  "Tell me about microfrontend",
];

/**
 * Tiled doodle wallpaper for the messaging skin — the same hand-drawn language as
 * the floating buttons, but with marks drawn from this portfolio (map pin, braces,
 * a tag, a prompt) rather than generic ones. Strokes read from --wa-ink so the
 * pattern follows the theme; a data: URI could not.
 */
function DoodleWallpaper({ id }: { id: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id={id} width="140" height="140" patternUnits="userSpaceOnUse">
          <g
            fill="none"
            stroke="var(--wa-ink)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* map pin */}
            <g transform="rotate(-8 18 22)">
              <path d="M18 14c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z" />
              <circle cx="18" cy="19" r="1.7" />
            </g>
            {/* sparkle */}
            <path d="M65 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" transform="rotate(10 65 16)" />
            {/* braces */}
            <g transform="rotate(-5 113 22)">
              <path d="M109 14c-3 0-3 3-3 4 0 2-1 3-2 3 1 0 2 1 2 3 0 1 0 4 3 4" />
              <path d="M117 14c3 0 3 3 3 4 0 2 1 3 2 3-1 0-2 1-2 3 0 1 0 4-3 4" />
            </g>
            {/* circle */}
            <circle cx="25" cy="60" r="7" />
            {/* tag </> */}
            <g transform="rotate(6 72 58)">
              <path d="M66 52l-5 6 5 6" />
              <path d="M78 52l5 6-5 6" />
              <path d="M75 50l-5 16" />
            </g>
            {/* squiggle */}
            <path d="M106 62c3-4 6 4 9 0s6-4 9 0" />
            {/* triangle */}
            <path d="M20 98l7 12H13z" transform="rotate(-10 20 104)" />
            {/* prompt window */}
            <g transform="rotate(4 65 105)">
              <rect x="54" y="98" width="22" height="14" rx="2.5" />
              <path d="M58 103l3 2-3 2" />
              <path d="M64 107h6" />
            </g>
            {/* heart */}
            <path
              d="M112 114c-6-4-8-7-8-9 0-2 2-3 4-3 2 0 3 1 4 2 1-1 2-2 4-2 2 0 4 1 4 3 0 2-2 5-8 9z"
              transform="rotate(-7 112 108)"
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export interface ChatPanelProps {
  height?: string;
  showChrome?: boolean;
  onClose?: () => void;
  suggestions?: "below" | "inside" | "none";
  variant?: "terminal" | "chatapp";
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ChatPanel({
  height = "520px",
  showChrome = true,
  onClose,
  suggestions: placement = "below",
  variant = "terminal",
  dragHandleProps,
  active = false,
  className,
  style,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      text: "Hey there! 👋 I’m the interactive assistant for this portfolio. Ask me about my skills, projects, or professional experience.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);

  const nextId = () => (idRef.current += 1);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch("/api/messages");
        const json = await res.json();
        if (!aliveRef.current) return;
        const rows: Message[] = json?.data ?? [];
        if (rows.length > 0) {
          setMessages(rows);
          idRef.current = Math.max(idRef.current, ...rows.map((r) => r.id));
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    }
    loadMessages();
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(hover: hover) and (min-width: 768px)").matches) {
      inputRef.current?.focus();
    }
  }, [active]);

  async function send(text: string) {
    if (!text.trim() || isTyping) return;
    const userText = text.trim();

    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: userText }]);
    setInput("");
    setIsTyping(true);
    setHasSent(true);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", text: userText }),
      });
    } catch (e) {
      console.error(e);
    }

    const answer = matchKB(userText);
    const delay = 600 + Math.min(answer.length * 12, 1400);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      if (!aliveRef.current) return;
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: nextId(), role: "bot", text: answer }]);

      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "bot", text: answer }),
        });
      } catch (e) {
        console.error(e);
      }
    }, delay);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send(input);
  }

  const patternId = useId();
  const isApp = variant === "chatapp";
  const canSend = Boolean(input.trim()) && !isTyping;

  const chromeBar = (
    <div
      className="relative flex items-center gap-2 px-3 py-2.5 shrink-0"
      style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="relative z-10 flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#febc2e" }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#28c840" }} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: C.green }}
        />
        <span className="font-mono text-[0.68rem] text-muted">dev_assistant — online</span>
      </div>

      <div className="flex-1" />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="close chat"
          title="close"
          className="relative z-10 flex items-center justify-center rounded w-6 h-6 bg-transparent border-none text-muted cursor-pointer p-0"
          style={{
            transition: "color 0.15s, background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = C.fg;
            e.currentTarget.style.backgroundColor = `${C.border}55`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.muted;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );

  const appHeader = (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 shrink-0"
      {...dragHandleProps}
      style={{
        backgroundColor: "var(--wa-header)",
        color: "var(--wa-header-fg)",
        ...dragHandleProps?.style,
      }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[0.95rem]"
        style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
      >
        💻
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[0.78rem] font-semibold leading-tight">dev_assistant</div>
        <div className="flex items-center gap-1.5" style={{ opacity: 0.8 }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#5ce65c]" />
          <span className="font-body text-[0.66rem]">{isTyping ? "typing…" : "online"}</span>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="close chat"
          title="close"
          className="shrink-0 flex items-center justify-center rounded-full w-6.5 h-6.5 bg-transparent border-none cursor-pointer p-0"
          style={{
            color: "var(--wa-header-fg)",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={15} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );

  const chipButtonStyle = (compact: boolean): React.CSSProperties => ({
    border: `1px solid ${isApp ? "var(--wa-accent)" : C.border}`,
    color: isApp ? "var(--wa-accent)" : C.muted,
    backgroundColor: isApp ? "var(--wa-in-bg)" : "transparent",
    cursor: isTyping ? "not-allowed" : "pointer",
  });

  const chipRow = (
    <div
      className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-3 pb-2 pt-2.25"
      style={{
        borderTop: `1px dashed ${isApp ? "var(--wa-border)" : C.border}`,
        backgroundColor: isApp ? "var(--wa-bar)" : "transparent",
      }}
    >
      {SUGGESTIONS.slice(0, 4).map((s) => (
        <button
          key={s}
          onClick={() => send(s)}
          disabled={isTyping}
          className="shrink-0 transition-all duration-150 text-xs rounded-full py-1 px-2 whitespace-nowrap bg-transparent"
          style={chipButtonStyle(true)}
        >
          {s}
        </button>
      ))}
    </div>
  );

  const chipBlock = (
    <div>
      <div className="font-mono text-[0.62rem] text-muted mb-2">
        <span style={{ color: C.red }}>//</span> suggested questions
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={isTyping}
            className="transition-all duration-150"
            style={chipButtonStyle(false)}
            onMouseEnter={(e) => {
              if (!isTyping) {
                e.currentTarget.style.borderColor = C.green;
                e.currentTarget.style.color = C.green;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.muted;
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  const windowBox = (
    <div
      className={`rounded-md overflow-hidden flex flex-col ${isApp ? "chat-wa" : ""} ${
        className ?? ""
      }`}
      style={{
        backgroundColor: isApp ? "var(--wa-canvas)" : C.surface,
        border: isApp ? "2px solid var(--wa-edge)" : `1px solid ${C.border}`,
        borderRadius: isApp ? 14 : undefined,
        height,
        ...style,
      }}
    >
      {showChrome && (isApp ? appHeader : chromeBar)}

      <div
        className="relative flex-1 min-h-0"
        style={{ backgroundColor: isApp ? "var(--wa-canvas)" : "transparent" }}
      >
        {isApp && <DoodleWallpaper id={patternId} />}
        <div
          ref={listRef}
          className="absolute inset-0 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar"
          style={{ overscrollBehavior: "contain" }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {!isApp && msg.role === "bot" && (
                <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs bg-surface2 text-[0.8rem] border border-border">
                  💻
                </div>
              )}
              {!isApp && msg.role === "user" && (
                <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs text-[0.8rem] border border-green/40 bg-green/20">
                  👤
                </div>
              )}
              <div
                className={`relative font-body text-[0.82rem] leading-[1.65] whitespace-pre-line ${isApp ? "max-w-[82%] py-1.75 px-2.75 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]" : "max-w-[75%] py-2.25 px-3.25"}`}
                style={{
                  borderRadius: msg.role === "bot" ? "0 8px 8px 8px" : "8px 0 8px 8px",
                  backgroundColor: isApp
                    ? msg.role === "bot"
                      ? "var(--wa-in-bg)"
                      : "var(--wa-out-bg)"
                    : msg.role === "bot"
                      ? C.surface2
                      : `${C.green}18`,
                  border: isApp
                    ? "none"
                    : `1px solid ${msg.role === "bot" ? C.border : C.green + "35"}`,
                  color: isApp
                    ? msg.role === "bot"
                      ? "var(--wa-in-fg)"
                      : "var(--wa-out-fg)"
                    : C.fg,
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5">
              {!isApp && (
                <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs bg-surface2 border border-border text-[0.8rem]">
                  💻
                </div>
              )}
              <div
                className={`flex items-center gap-1.5 px-4 py-3 rounded-r-lg rounded-b-lg ${isApp ? "border-none shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]" : "border border-border"}`}
                style={{
                  backgroundColor: isApp ? "var(--wa-in-bg)" : C.surface2,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isApp ? "var(--wa-muted)" : C.muted,
                      animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {placement === "inside" && !hasSent && chipRow}

      <div
        className="shrink-0 p-3"
        style={{
          borderTop: `1px solid ${isApp ? "var(--wa-border)" : C.border}`,
          backgroundColor: isApp ? "var(--wa-bar)" : "transparent",
        }}
      >
        <div
          className={`flex gap-2 items-center ${isApp ? "rounded-full py-1.25 pr-1.5 pl-3.5" : ""}`}
          style={
            isApp
              ? {
                  backgroundColor: "var(--wa-bar-field)",
                }
              : undefined
          }
        >
          {!isApp && <span className="font-mono text-[0.75rem] text-green shrink-0">$</span>}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isApp ? "Type a message" : "Ask me anything..."}
            className={`bg-transparent border-0 border-none outline-0 outline-none text-xs min-w-0 ${isApp ? "font-body text-[0.82rem]" : "font-mono"}`}
            style={{
              flex: 1,
              color: isApp ? "var(--wa-in-fg)" : C.fg,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!canSend}
            aria-label="send message"
            className={isApp ? "flex items-center justify-center" : undefined}
            style={
              isApp
                ? {
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    border: "none",
                    cursor: canSend ? "pointer" : "not-allowed",
                    backgroundColor: canSend ? "var(--wa-accent)" : "transparent",
                    color: canSend ? "#fff" : "var(--wa-muted)",
                    opacity: canSend ? 1 : 0.55,
                    transition: "all 0.15s",
                    flexShrink: 0,
                    padding: 0,
                  }
                : {
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: "3px",
                    border: "none",
                    cursor: canSend ? "pointer" : "not-allowed",
                    backgroundColor: canSend ? C.green : C.surface2,
                    color: canSend ? "#0d1117" : C.muted,
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }
            }
          >
            {isApp ? <SendHorizontal size={16} strokeWidth={2.2} /> : "send ↵"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "contents" }}>
      {windowBox}
      {placement === "below" && chipBlock}
    </div>
  );
}

export default ChatPanel;
