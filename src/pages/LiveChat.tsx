import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: 'var(--bg-color)',
  surface: 'var(--surface-color)',
  surface2: 'var(--surface2-color)',
  border: 'var(--border-color)',
  muted: 'var(--muted-color)',
  fg: 'var(--fg-color)',
  green: 'var(--green-color)',
  amber: 'var(--amber-color)',
  blue: 'var(--blue-color)',
  purple: 'var(--purple-color)',
  red: 'var(--red-color)',
  teal: 'var(--teal-color)',
  orange: 'var(--orange-color)',
}

type Role = 'user' | 'bot'
interface Message { id: number; role: Role; text: string; typing?: boolean }

// ─── knowledge base ───────────────────────────────────────────────────────────
const kb: { patterns: RegExp[]; answer: string }[] = [
  {
    patterns: [/halo|hai|hello|hi|hey|selamat/i],
    answer: "Halo! 👋 I'm the dev assistant for this portfolio. Ask me anything about background, skills, work experience, or projects!",
  },
  {
    patterns: [/nama|name|siapa|who are you|siapa kamu/i],
    answer: "My name is [Your Name] — a Full-Stack Engineer & Map Specialist based in Indonesia. I build geospatial platforms, REST APIs, and micro-frontend architectures.",
  },
  {
    patterns: [/lokasi|location|kota|domisili|where|tinggal/i],
    answer: "📍 Based in Indonesia, working remote-first. Open to fully remote opportunities worldwide.",
  },
  {
    patterns: [/pengalaman|experience|berapa lama|how long|tahun/i],
    answer: "3+ years of professional experience:\n• 2024 – Senior Frontend at a Geo-Tech startup (MapLibre, Vue.js, microfrontend)\n• 2023 – Fullstack Engineer at a SaaS platform (Next.js + Go + PostgreSQL)\n• 2022 – Frontend Developer at a digital agency\n• 2021 – Started as Junior Dev / Freelance",
  },
  {
    patterns: [/golang|go lang|backend/i],
    answer: "Go is my primary backend language. I build REST APIs with clean middleware stacks, JWT auth, Swagger docs, and Dockerised deployments behind Nginx. Proficiency: ~85%.",
  },
  {
    patterns: [/frontend|react|next|vue|javascript|typescript/i],
    answer: "Frontend is where I spend most of my time:\n• Next.js & Vue.js — primary frameworks (~92%)\n• TypeScript — always\n• TanStack Query — data fetching & caching\n• Tailwind + Styled Components — styling\n• Microfrontend architecture — Vue + React via module federation",
  },
  {
    patterns: [/maplibre|google maps|peta|map|geojson|geospatial|geo|places api/i],
    answer: "🗺️ Maps & Geo are my speciality! I've built:\n• Real-time fleet tracking with MapLibre GL JS + GeoJSON\n• Custom vector tile layers & polygon overlays\n• Places API autocomplete for location search\n• PostGIS schemas for geospatial data\nProficiency: MapLibre ~83%, Google Maps API ~80%.",
  },
  {
    patterns: [/database|postgresql|postgres|mongodb|prisma|erd/i],
    answer: "Database stack:\n• PostgreSQL — primary, with Prisma ORM for type-safe queries\n• MongoDB — for metadata-heavy services\n• ERD design before writing a single migration\n• Familiar with PostGIS for geospatial extensions",
  },
  {
    patterns: [/docker|devops|jenkins|nginx|cicd|ci\/cd/i],
    answer: "DevOps toolkit:\n• Docker — containerise everything, multi-stage builds\n• Nginx — reverse proxy, TLS termination, rate limiting\n• Jenkins — CI/CD pipelines (build → test → deploy)\n• Git + GitHub + GitLab — daily workflow\n• MinIO — S3-compatible object storage",
  },
  {
    patterns: [/testing|jest|playwright|katalon|e2e|unit test/i],
    answer: "Testing is non-negotiable:\n• Jest — unit & integration tests\n• Playwright — E2E automation (browser testing)\n• Katalon Studio — regression testing for enterprise clients\nI aim for >80% test coverage on critical paths.",
  },
  {
    patterns: [/arsitektur|architecture|microfrontend|design pattern|sdlc|trd/i],
    answer: "Architecture interests:\n• Microfrontend — module federation, cross-team coordination\n• Client-Server Architecture — clear API contracts\n• Component-Based Architecture — reusable, testable UI\n• SDLC & TRD documentation — I write tech docs before coding",
  },
  {
    patterns: [/proyek|project|portofolio|portfolio|what have you built/i],
    answer: "Selected projects:\n1. 🗺️ GeoTrack — Fleet mapping (Vue.js + MapLibre + GeoJSON)\n2. 🏙️ CityNav — Geo explorer (Next.js + MapLibre + TanStack Query)\n3. ⚡ Nexus — Multi-tenant SaaS (Next.js + Go + PostgreSQL + Docker)\n4. 🗄️ StoreVault — Media service (Go + MinIO + MongoDB)\n\nCheck the Projects page for details!",
  },
  {
    patterns: [/hire|freelance|kontrak|kerja sama|available|open to work/i],
    answer: "✅ Yes, I'm currently open to:\n• Full-time roles (frontend, fullstack, or geo-focused)\n• Freelance projects\n• Geospatial engineering collaborations\n\nResponse time: within 24 hours. Drop a message on the Contact page!",
  },
  {
    patterns: [/skill|kemampuan|technology|tech stack|bisa apa/i],
    answer: "Full skill set:\n🖥️ Frontend: Next.js, Vue.js, TypeScript, TanStack Query, Tailwind, Styled Components, MapLibre, Google Maps JS API\n⚙️ Backend: Golang, Express.js, REST API, JWT, OAuth 2.0, Swagger\n🗄️ DB: PostgreSQL, MongoDB, Prisma, ERD\n🐳 DevOps: Docker, Nginx, Jenkins, MinIO, Git\n🧪 Testing: Jest, Playwright, Katalon Studio",
  },
  {
    patterns: [/blog|tulisan|writing|artikel|article/i],
    answer: "📝 I write about things I learn on the job:\n• MapLibre & GeoJSON patterns\n• Go REST API design\n• Microfrontend in production\n• Docker + Nginx deployment\n• TanStack Query for map-heavy dashboards\n\nCheck the Writing page!",
  },
  {
    patterns: [/kontak|contact|email|hubungi/i],
    answer: "📬 Reach me at: hello@devsketch.io\n⏱ Response time: usually within 24 hours.\nOr just fill out the form — I'll get back to you.",
  },
]

function matchKB(input: string): string {
  const hit = kb.find(k => k.patterns.some(p => p.test(input)))
  return hit?.answer ?? "Hmm, I'm not sure about that specific topic. Try asking about my skills, projects, experience, maps/geo work, or availability! 🤔"
}

const suggestions = [
  'What is your tech stack?',
  'Tell me about your map projects',
  'Are you available for hire?',
  'How much experience do you have?',
  'What is your Go experience?',
  'Tell me about microfrontend',
]

let idCounter = 3

export function LiveChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', text: "Hey there! 👋 I'm the interactive assistant for this portfolio." },
    { id: 2, role: 'bot', text: "Ask me anything about my background, skills, projects, work experience, or availability. I'm here to help!" },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error loading messages from Supabase:', error)
        return
      }

      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          text: m.text,
        })))
      }
    }

    loadMessages()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function send(text: string) {
    if (!text.trim() || isTyping) return
    const userText = text.trim()
    
    // 1. Tambah user message ke state lokal dulu
    const userMsgId = ++idCounter
    const userMsg: Message = { id: userMsgId, role: 'user', text: userText }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // 2. Simpan user message ke Supabase
    const { data: userInsertData } = await supabase
      .from('messages')
      .insert([{ role: 'user', text: userText }])
      .select()

    const answer = matchKB(userText)
    const delay = 600 + Math.min(answer.length * 12, 1400)

    setTimeout(async () => {
      setIsTyping(false)
      const botMsgId = ++idCounter
      setMessages(prev => [...prev, { id: botMsgId, role: 'bot', text: answer }])

      // 3. Simpan bot message ke Supabase
      await supabase
        .from('messages')
        .insert([{ role: 'bot', text: answer }])
    }, delay)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send(input)
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div className="px-6 pt-12 pb-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: C.green }}>// 04</span>
          <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 700, color: C.fg, margin: 0 }}>live_chat</h1>
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.muted }}>
          <span style={{ color: C.red }}>./</span>ask about background · work · professional experience
        </p>
      </div>

      <div className="px-6 pb-10 max-w-5xl mx-auto w-full flex flex-col gap-4 flex-1">
        {/* chat window */}
        <div className="rounded-md overflow-hidden flex flex-col" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, height: '520px' }}>
          {/* chrome bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border}` }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.green }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: C.muted }}>dev_assistant — online</span>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* avatar */}
                {msg.role === 'bot' && (
                  <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, fontSize: '0.8rem' }}>
                    💻
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${C.green}18`, border: `1px solid ${C.green}40`, fontSize: '0.8rem' }}>
                    👤
                  </div>
                )}
                {/* bubble */}
                <div style={{
                  maxWidth: '75%',
                  padding: '9px 13px',
                  borderRadius: msg.role === 'bot' ? '0 8px 8px 8px' : '8px 0 8px 8px',
                  backgroundColor: msg.role === 'bot' ? C.surface2 : `${C.green}18`,
                  border: `1px solid ${msg.role === 'bot' ? C.border : C.green + '35'}`,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.82rem',
                  lineHeight: '1.65',
                  color: C.fg,
                  whiteSpace: 'pre-line',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs"
                  style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, fontSize: '0.8rem' }}>
                  💻
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-r-lg rounded-b-lg"
                  style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}` }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.muted, animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* input bar */}
          <div className="shrink-0 p-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <div className="flex gap-2 items-center">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: C.green, flexShrink: 0 }}>$</span>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="ask me anything..."
                style={{
                  flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: C.fg,
                }}
              />
              <button onClick={() => send(input)}
                disabled={!input.trim() || isTyping}
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 600,
                  padding: '5px 12px', borderRadius: '3px', border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                  backgroundColor: input.trim() && !isTyping ? C.green : C.surface2,
                  color: input.trim() && !isTyping ? '#0d1117' : C.muted, transition: 'all 0.15s',
                }}>
                send ↵
              </button>
            </div>
          </div>
        </div>

        {/* suggestion chips */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: C.muted, marginBottom: '8px' }}>
            <span style={{ color: C.red }}>//</span> suggested questions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)} disabled={isTyping}
                className="transition-all duration-150"
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', fontWeight: 400,
                  padding: '5px 12px', borderRadius: '4px', border: `1px solid ${C.border}`,
                  backgroundColor: 'transparent', color: C.muted, cursor: isTyping ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!isTyping) { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
