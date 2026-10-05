import { useState } from 'react'
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

function SketchBorder({ className = '', children, color = C.border }: {
  className?: string; children?: React.ReactNode; color?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)"
          fill="transparent" stroke={color} strokeWidth="1.5"
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

type FilterKey = 'all' | 'frontend' | 'fullstack'

const projects = [
  {
    id: 'geotrak',
    title: 'GeoTrack — Fleet Mapping',
    role: 'frontend' as FilterKey,
    year: '2024',
    color: C.teal,
    stack: ['Vue.js', 'TypeScript', 'MapLibre GL JS', 'Google Maps JS API', 'Places API', 'GeoJSON', 'TanStack Query', 'Styled Components'],
    desc: 'Real-time fleet tracking dashboard. Custom GeoJSON route layers on MapLibre, Places API autocomplete, live vehicle-position polling via TanStack Query.',
    img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=640&h=360&fit=crop&auto=format',
    metrics: [{ k: 'vehicles', v: '500+' }, { k: 'latency', v: '<200ms' }, { k: 'coverage', v: 'Jest 91%' }],
    repo: 'github.com/you/geotrak',
  },
  {
    id: 'citynav',
    title: 'CityNav — Geo Explorer',
    role: 'frontend' as FilterKey,
    year: '2024',
    color: C.blue,
    stack: ['Next.js', 'TypeScript', 'MapLibre GL JS', 'GeoJSON', 'TanStack Query', 'Tailwind CSS', 'Jest'],
    desc: 'Interactive city exploration with custom MapLibre vector tiles, GeoJSON polygon overlays for district boundaries, and TanStack Query-powered POI search.',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&h=360&fit=crop&auto=format',
    metrics: [{ k: 'tiles', v: 'vector' }, { k: 'test cov', v: '94%' }, { k: 'ttfb', v: '<1s' }],
    repo: 'github.com/you/citynav',
  },
  {
    id: 'nexus',
    title: 'Nexus — Fullstack SaaS',
    role: 'fullstack' as FilterKey,
    year: '2024',
    color: C.green,
    stack: ['Next.js', 'Golang', 'PostgreSQL', 'Prisma ORM', 'Docker', 'Nginx', 'JWT', 'Google OAuth 2.0', 'TanStack Query', 'Tailwind CSS', 'Swagger', 'Playwright', 'Jenkins'],
    desc: 'Multi-tenant SaaS platform. Go REST API, Prisma + PostgreSQL, Next.js SSR front-end with Google OAuth 2.0 + JWT auth, Dockerised behind Nginx, Playwright E2E on Jenkins CI.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=360&fit=crop&auto=format',
    metrics: [{ k: 'tenants', v: 'multi' }, { k: 'ci/cd', v: 'Jenkins' }, { k: 'docs', v: 'Swagger' }],
    repo: 'github.com/you/nexus',
  },
  {
    id: 'storevault',
    title: 'StoreVault — Media Service',
    role: 'fullstack' as FilterKey,
    year: '2023',
    color: C.purple,
    stack: ['Golang', 'Express.js', 'MinIO', 'MongoDB', 'Docker', 'Nginx', 'JWT', 'Postman', 'Katalon Studio'],
    desc: 'S3-compatible media storage on MinIO, Golang REST API, Express.js gateway, MongoDB metadata, JWT auth, Dockerised Nginx proxy, Katalon Studio regression suite.',
    img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&h=360&fit=crop&auto=format',
    metrics: [{ k: 'storage', v: 'MinIO S3' }, { k: 'meta', v: 'MongoDB' }, { k: 'e2e', v: 'Katalon' }],
    repo: 'github.com/you/storevault',
  },
]

const filterLabels: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'frontend', label: 'frontend' },
  { key: 'fullstack', label: 'fullstack' },
]

export function Projects() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [active, setActive] = useState<string | null>(null)

  const visible = filter === 'all' ? projects : projects.filter(p => p.role === filter)

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* page header */}
      <div className="px-6 pt-12 pb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: C.green }}>// 02</span>
          <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 700, color: C.fg, margin: 0 }}>selected_projects</h1>
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.muted }}>
          <span style={{ color: C.red }}>./</span>things i've built · click to expand
        </p>
      </div>

      {/* filter tabs */}
      <div className="px-6 max-w-5xl mx-auto mb-6">
        <div className="inline-flex rounded-md overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {filterLabels.map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setActive(null) }}
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 500,
                padding: '7px 16px', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                backgroundColor: filter === f.key ? C.surface2 : 'transparent',
                color: filter === f.key ? C.green : C.muted,
                borderRight: f.key !== 'fullstack' ? `1px solid ${C.border}` : 'none',
              }}>
              {filter === f.key && <span style={{ color: C.red }}>▶ </span>}{f.label}
            </button>
          ))}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: C.muted, marginLeft: '12px' }}>
          {visible.length} result{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* project list */}
      <div className="px-6 pb-20 max-w-5xl mx-auto flex flex-col gap-4">
        {visible.map(p => {
          const open = active === p.id
          return (
            <div key={p.id}
              className="cursor-pointer transition-all duration-250 rounded-md"
              onClick={() => setActive(open ? null : p.id)}
              style={{ border: `1px solid ${open ? p.color : C.border}`, backgroundColor: open ? `${p.color}06` : C.surface }}
              onMouseEnter={e => { if (!open) (e.currentTarget as HTMLDivElement).style.borderColor = `${p.color}50` }}
              onMouseLeave={e => { if (!open) (e.currentTarget as HTMLDivElement).style.borderColor = C.border }}>

              {/* header */}
              <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', fontWeight: 600, padding: '2px 8px', borderRadius: '3px', backgroundColor: `${p.color}18`, border: `1px solid ${p.color}40`, color: p.color }}>
                    {p.role}
                  </span>
                  <h3 style={{ fontFamily: "'Caveat', cursive", fontSize: '1.45rem', fontWeight: 700, color: C.fg, margin: 0 }}>{p.title}</h3>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', color: C.muted }}>{p.year}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    {p.stack.slice(0, 3).map(s => (
                      <span key={s} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', padding: '2px 6px', borderRadius: '2px', backgroundColor: C.surface2, color: C.muted, border: `1px solid ${C.border}` }}>{s}</span>
                    ))}
                    {p.stack.length > 3 && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', color: C.muted }}>+{p.stack.length - 3}</span>}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem', color: p.color, transition: 'transform 0.25s', transform: open ? 'rotate(45deg)' : 'none', display: 'inline-block', lineHeight: 1 }}>+</span>
                </div>
              </div>

              {/* expanded */}
              {open && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: `${p.color}25` }}>
                  <div className="grid md:grid-cols-5 gap-6 mt-5 items-start">
                    <div className="md:col-span-3">
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', lineHeight: '1.8', color: C.muted, marginBottom: '1rem' }}>{p.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {p.stack.map(s => (
                          <span key={s} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', padding: '3px 8px', borderRadius: '2px', backgroundColor: `${p.color}10`, border: `1px solid ${p.color}35`, color: p.color }}>{s}</span>
                        ))}
                      </div>
                      <div className="flex gap-3 flex-wrap items-center">
                        {p.metrics.map(m => (
                          <SketchBorder key={m.k} color={p.color}>
                            <div className="relative z-10 px-3 py-1.5 text-center">
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', fontWeight: 700, color: p.color }}>{m.v}</div>
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.52rem', color: C.muted }}>{m.k}</div>
                            </div>
                          </SketchBorder>
                        ))}
                        <a href="#" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: C.muted, textDecoration: 'none', padding: '4px 10px', border: `1px solid ${C.border}`, borderRadius: '3px' }}
                          onMouseEnter={e => e.currentTarget.style.color = C.fg}
                          onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                          ↗ {p.repo}
                        </a>
                      </div>
                    </div>
                    <div className="md:col-span-2 overflow-hidden rounded" style={{ border: `1px solid ${p.color}35`, backgroundColor: C.surface2 }}>
                      <img src={p.img} alt={p.title} className="w-full h-40 object-cover opacity-75" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
