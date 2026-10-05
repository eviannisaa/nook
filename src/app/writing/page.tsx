'use client'

import { useState } from 'react'

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

type TagKey = 'all' | 'maps' | 'golang' | 'frontend' | 'devops' | 'architecture'

const posts = [
  {
    slug: 'maplibre-geojson-guide',
    title: 'Building Real-Time Maps with MapLibre GL JS & GeoJSON',
    date: '2024-11-08',
    tag: 'maps' as TagKey,
    color: C.teal,
    readTime: '8 min',
    excerpt: 'A deep dive into rendering live vehicle positions and route overlays using MapLibre GL JS, custom GeoJSON sources, and WebSocket data streams. Covers layer management, performance tips for 500+ markers, and clustering.',
    topics: ['MapLibre', 'GeoJSON', 'Vue.js', 'WebSocket'],
  },
  {
    slug: 'golang-rest-api-patterns',
    title: 'Go REST API Patterns I Actually Use in Production',
    date: '2024-09-22',
    tag: 'golang' as TagKey,
    color: C.green,
    readTime: '12 min',
    excerpt: 'Beyond "hello world" — middleware stacks, structured error responses, JWT refresh flow, Swagger auto-gen with swaggo, and how to organise a Go service that others can read six months later.',
    topics: ['Golang', 'REST API', 'JWT', 'Swagger'],
  },
  {
    slug: 'microfrontend-vue-react',
    title: 'Microfrontend in Practice: Sharing State Between Vue and React',
    date: '2024-07-14',
    tag: 'frontend' as TagKey,
    color: C.blue,
    readTime: '10 min',
    excerpt: 'How we split a monolithic Next.js app into Vue.js + React micro-frontends without breaking the user experience. Covers module federation config, shared auth tokens, and cross-framework event buses.',
    topics: ['Microfrontend', 'Vue.js', 'React', 'TypeScript'],
  },
  {
    slug: 'docker-nginx-golang',
    title: 'Dockerising a Golang API Behind Nginx — the Right Way',
    date: '2024-05-30',
    tag: 'devops' as TagKey,
    color: C.purple,
    readTime: '7 min',
    excerpt: 'Multi-stage Docker builds for a Go binary, reverse proxy config in Nginx, TLS termination, rate limiting, and a Jenkins pipeline that deploys to a VPS without downtime.',
    topics: ['Docker', 'Nginx', 'Golang', 'Jenkins'],
  },
  {
    slug: 'tanstack-query-patterns',
    title: 'TanStack Query Patterns for Map-Heavy Dashboards',
    date: '2024-03-17',
    tag: 'frontend' as TagKey,
    color: C.orange,
    readTime: '9 min',
    excerpt: 'Polling live GPS coordinates, invalidating stale GeoJSON layers, and keeping UI responsive while MapLibre re-renders — practical TanStack Query patterns from a real fleet tracking project.',
    topics: ['TanStack Query', 'Next.js', 'MapLibre', 'TypeScript'],
  },
  {
    slug: 'database-design-geospatial',
    title: 'ERD & Database Design for Geospatial Applications',
    date: '2024-01-09',
    tag: 'architecture' as TagKey,
    color: C.amber,
    readTime: '11 min',
    excerpt: 'How to model routes, waypoints, regions, and real-time positions in PostgreSQL with PostGIS extensions. Includes ERD walk-through, index strategy, and when to use MongoDB for metadata instead.',
    topics: ['PostgreSQL', 'ERD', 'Database Design', 'GeoJSON'],
  },
]

const tags: { key: TagKey; label: string; color: string }[] = [
  { key: 'all', label: 'all', color: C.fg },
  { key: 'maps', label: 'maps', color: C.teal },
  { key: 'golang', label: 'golang', color: C.green },
  { key: 'frontend', label: 'frontend', color: C.blue },
  { key: 'devops', label: 'devops', color: C.purple },
  { key: 'architecture', label: 'architecture', color: C.amber },
]

export default function Writing() {
  const [activeTag, setActiveTag] = useState<TagKey>('all')
  const visible = activeTag === 'all' ? posts : posts.filter(p => p.tag === activeTag)

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* header */}
      <div className="px-6 pt-12 pb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: C.green }}>// 03</span>
          <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 700, color: C.fg, margin: 0 }}>writing</h1>
          <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.muted }}>
          <span style={{ color: C.red }}>./</span>things i've learned · written down so i don't forget
        </p>
      </div>

      {/* tag filter */}
      <div className="px-6 max-w-5xl mx-auto mb-8 flex flex-wrap gap-2">
        {tags.map(t => (
          <button key={t.key} onClick={() => setActiveTag(t.key)}
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 500,
              padding: '5px 13px', borderRadius: '3px', cursor: 'pointer', border: `1px solid ${activeTag === t.key ? t.color : C.border}`,
              backgroundColor: activeTag === t.key ? `${t.color}15` : 'transparent',
              color: activeTag === t.key ? t.color : C.muted, transition: 'all 0.15s',
            }}>
            #{t.label}
          </button>
        ))}
      </div>

      {/* posts grid */}
      <div className="px-6 pb-20 max-w-5xl mx-auto grid md:grid-cols-2 gap-5">
        {visible.map(post => (
          <article key={post.slug}
            className="group cursor-pointer rounded-md transition-all duration-200"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${post.color}50`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>

            {/* color bar */}
            <div className="h-0.5 rounded-t-md" style={{ backgroundColor: post.color }} />

            <div className="p-5">
              {/* meta */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', fontWeight: 600, padding: '2px 7px', borderRadius: '2px', backgroundColor: `${post.color}18`, border: `1px solid ${post.color}35`, color: post.color }}>
                  #{post.tag}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: C.muted }}>{post.date}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: C.muted }}>· {post.readTime} read</span>
              </div>

              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: '1.35rem', fontWeight: 700, color: C.fg, lineHeight: 1.2, marginBottom: '0.6rem' }}>
                {post.title}
              </h2>

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', lineHeight: '1.7', color: C.muted, marginBottom: '1rem' }}>
                {post.excerpt}
              </p>

              {/* topics */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.topics.map(t => (
                  <span key={t} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem', padding: '2px 6px', borderRadius: '2px', backgroundColor: C.surface2, color: C.muted, border: `1px solid ${C.border}` }}>{t}</span>
                ))}
              </div>

              <a href="#"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: post.color, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                read more →
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
