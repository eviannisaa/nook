import { Link } from 'react-router'

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

function SketchBorder({ className = '', children, color = C.border, fill = 'transparent' }: {
  className?: string; children?: React.ReactNode; color?: string; fill?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)"
          fill={fill} stroke={color} strokeWidth="1.5"
          strokeDasharray="7 3 4 2 8 3" strokeLinecap="round"
          rx="3" vectorEffect="non-scaling-stroke" />
        <circle cx="5" cy="5" r="1.5" fill={color} opacity="0.6" />
        <circle cx="calc(100% - 5px)" cy="5" r="1.5" fill={color} opacity="0.6" />
        <circle cx="5" cy="calc(100% - 5px)" r="1.5" fill={color} opacity="0.6" />
        <circle cx="calc(100% - 5px)" cy="calc(100% - 5px)" r="1.5" fill={color} opacity="0.6" />
      </svg>
      {children}
    </div>
  )
}

function TermWindow({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-md overflow-hidden ${className}`}
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ backgroundColor: C.surface2, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
        </div>
        <span className="flex-1 text-center" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: C.muted }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

const timeline = [
  { year: '2024', title: 'Senior Frontend Engineer', place: 'Geo-Tech Startup', color: C.green, desc: 'Built real-time fleet tracking with MapLibre + Vue.js. Led microfrontend architecture migration across 3 teams.' },
  { year: '2023', title: 'Fullstack Engineer', place: 'SaaS Platform', color: C.teal, desc: 'Delivered Next.js + Golang SaaS with Google OAuth 2.0, Prisma ORM, Docker, Nginx. Full Playwright E2E coverage.' },
  { year: '2022', title: 'Frontend Developer', place: 'Digital Agency', color: C.blue, desc: 'Developed Vue.js & Next.js apps. Integrated Google Maps JS API and Places API for logistics clients.' },
  { year: '2021', title: 'Junior Developer', place: 'Bootcamp → Freelance', color: C.amber, desc: 'Started with React, fell in love with maps. Built first GeoJSON visualizer and REST API in Express.js.' },
]

const facts = [
  { emoji: '🗺️', label: 'Speciality', value: 'Geo & Maps Engineering' },
  { emoji: '⚡', label: 'Backend', value: 'Golang · Express.js · REST' },
  { emoji: '🖥️', label: 'Frontend', value: 'Next.js · Vue.js · MapLibre' },
  { emoji: '🐳', label: 'DevOps', value: 'Docker · Jenkins · Nginx' },
  { emoji: '🧪', label: 'Testing', value: 'Jest · Playwright · Katalon' },
  { emoji: '🏗️', label: 'Architecture', value: 'Microfrontend · SDLC · ERD' },
]

const jsDoc = [
  '/**',
  ' * @name     Evi Nur Annisa',
  ' * @role     Full-Stack Engineer & Map Specialist',
  ' * @location Remote-first · Anywhere',
  ' * @focus    Geospatial · API Design · Microfrontend',
  ' * @values   Clean code · Good maps · Honest systems',
  ' * @fun      Draws ERDs in notebooks before coding',
  ' */',
]

export function About() {
  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* page header */}
      <div className="px-6 pt-12 pb-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: C.green }}>// 01</span>
          <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 700, color: C.fg, margin: 0 }}>about_me</h1>
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.muted }}>
          <span style={{ color: C.red }}>./</span>who i am, what i do, how i got here
        </p>
      </div>

      <div className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* jsdoc card */}
          <TermWindow title="about.js">
            <div className="p-5">
              {jsDoc.map((line, i) => (
                <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', lineHeight: '1.8rem', color: C.muted, whiteSpace: 'nowrap' }}>
                  {line}
                </div>
              ))}
              <div style={{ marginTop: '16px' }}>
                {[
                  [C.red, 'const ', C.blue, 'me', C.fg, ' = {'],
                  [C.fg, '  stack:   ', C.teal, '"Go + Next.js + Vue + MapLibre"', C.fg, ','],
                  [C.fg, '  db:      ', C.teal, '"PostgreSQL · MongoDB · Prisma"', C.fg, ','],
                  [C.fg, '  devops:  ', C.teal, '"Docker · Jenkins · Nginx"', C.fg, ','],
                  [C.fg, '  open:    ', C.orange, 'true', C.fg, ','],
                  [C.fg, '}'],
                ].map((row, i) => (
                  <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', lineHeight: '1.8rem', whiteSpace: 'nowrap' }}>
                    {Array.from({ length: row.length / 2 }, (_, j) => (
                      <span key={j} style={{ color: row[j * 2] as string }}>{row[j * 2 + 1]}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </TermWindow>

          {/* bio + facts */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 72 72" fill="none">
                  <path d="M36,3 C54,2 69,15 69,36 C69,57 55,69 36,69 C17,69 3,56 3,36 C3,16 18,3 36,3 Z"
                    stroke={C.green} strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" fill="none" />
                </svg>
                <img
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=140&h=140&fit=crop&auto=format"
                  alt="Profile"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', filter: 'grayscale(15%)' }}
                />
                <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 animate-pulse"
                  style={{ backgroundColor: C.green, borderColor: C.bg }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: '1.5rem', fontWeight: 700, color: C.fg }}>Evi Nur Annisa</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: C.muted }}>full-stack engineer · map specialist</div>
              </div>
            </div>

            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', lineHeight: '1.8', color: C.muted }}>
              I'm a full-stack engineer who sketches system architecture on paper before touching the keyboard. My strongest areas are <span style={{ color: C.blue }}>geospatial front-ends</span> (MapLibre, GeoJSON, Google Maps) and <span style={{ color: C.green }}>production-grade backends</span> in Go — connected by clean REST APIs, solid auth, and CI/CD that ships.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {facts.map(f => (
                <SketchBorder key={f.label} className="p-3" color={C.border} fill={C.surface}>
                  <div className="relative z-10 p-0.5">
                    <div className="text-base mb-0.5">{f.emoji}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: C.green, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.74rem', fontWeight: 500, color: C.fg, lineHeight: '1.3', marginTop: '2px' }}>{f.value}</div>
                  </div>
                </SketchBorder>
              ))}
            </div>
          </div>
        </div>

        {/* timeline */}
        <div className="mb-10">
          <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: '1.8rem', fontWeight: 700, color: C.fg, marginBottom: '1.5rem' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.green, marginRight: '10px' }}>git log</span>
            experience
          </h2>
          <div className="relative pl-6" style={{ borderLeft: `1px dashed ${C.border}` }}>
            {timeline.map((t, i) => (
              <div key={i} className="relative mb-8 pl-6">
                {/* dot */}
                <div className="absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{ backgroundColor: t.color, borderColor: C.bg, boxShadow: `0 0 8px ${t.color}60` }} />
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: t.color }}>{t.year}</span>
                  <span style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem', fontWeight: 700, color: C.fg }}>{t.title}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: C.muted }}>@ {t.place}</span>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.83rem', lineHeight: '1.7', color: C.muted, maxWidth: '560px' }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap gap-3">
          <Link to="/projects"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 600, padding: '9px 20px', backgroundColor: C.green, color: '#0d1117', borderRadius: '4px', textDecoration: 'none' }}>
            $ view projects →
          </Link>
          <Link to="/chat"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 500, padding: '9px 20px', backgroundColor: 'transparent', color: C.muted, borderRadius: '4px', textDecoration: 'none', border: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.color = C.fg)}
            onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
            💬 ask me anything
          </Link>
        </div>
      </div>
    </div>
  )
}
