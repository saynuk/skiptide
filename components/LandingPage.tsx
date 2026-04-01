'use client'

import { useState } from 'react'
import Link from 'next/link'

type PreviewPost = {
  title: string
  excerpt: string
  url: string
  publishedAt: string
}

type PreviewSource = {
  title: string
  feedUrl: string
  faviconUrl: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 1) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (diffDays < 2) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<PreviewSource | null>(null)
  const [posts, setPosts] = useState<PreviewPost[]>([])
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  async function handleTry(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setSource(null)
    setPosts([])

    const res = await fetch('/api/try', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong. Try a different URL.')
      return
    }

    setSource(data.source)
    setPosts(data.posts)
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEmailLoading(true)

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    setEmailLoading(false)
    setEmailSent(true)
  }

  return (
    <div style={s.page}>
      {/* Soft background orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />

      <div style={s.inner}>
        {/* Nav */}
        <nav style={s.nav}>
          <div style={s.logo}>skip<span style={s.logoSpan}>tide</span></div>
          <Link href="/login" style={s.signInBtn}>Sign in</Link>
        </nav>

        {/* Hero */}
        <section style={s.hero}>
          <p style={s.eyebrow}>A quiet corner of the internet</p>
		  <h1 style={s.headline}>
			  Zenscroll the independent writers you follow.
			</h1>
			<p style={s.headlineSub} className="headline-sub">
			  No ads, trolls, or popups.
			</p>			
			<p style={s.sub}>
            <strong>Add your first one:</strong> Paste any newsletter or blog below to get started. Add more for an algorithm-free experience with the people you follow.
          </p>

          {/* Try it */}
          <div style={s.tryBox}>
            <form onSubmit={handleTry} style={s.tryRow} className="try-row">
              <input
                style={s.tryInput}
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="Paste any Substack, blog, or newsletter link…"
                disabled={loading}
              />
              <button type="submit" style={s.tryBtn} disabled={loading}>
                {loading ? 'Looking…' : 'Show me'}
              </button>
            </form>
            <p style={s.tryHint}>Works with Substack, Medium, Ghost, and most blogs</p>

            {error && <p style={s.tryError}>{error}</p>}

            {/* Preview results */}
            {source && posts.length > 0 && (
              <div style={s.preview}>
                <div style={s.previewSource}>{source.title}</div>
                {posts.map((post, i) => (
                  <a
                    key={i}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={s.previewPost}
                  >
                    <div style={s.previewDot} />
                    <div>
                      <div style={s.previewTitle}>{post.title}</div>
                      {post.excerpt && <div style={s.previewExcerpt}>{post.excerpt}</div>}
                      <div style={s.previewDate}>{formatDate(post.publishedAt)}</div>
                    </div>
                  </a>
                ))}

                {/* Signup prompt */}
                <div style={s.signupPrompt}>
                  {emailSent ? (
                    <p style={s.signupSent}>
                      ✓ Check your email for a sign-in link. Check spam if you don't see it.
                    </p>
                  ) : (
                    <>
                      <p style={s.signupText}>
                        Want to follow more writers and save your feed?
                      </p>
                      <p style={s.signupSub}>Free, no password — just your email.</p>
                      <form onSubmit={handleSignup} style={s.signupRow}>
                        <input
                          style={s.signupInput}
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          disabled={emailLoading}
                        />
                        <button type="submit" style={s.signupBtn} disabled={emailLoading}>
                          {emailLoading ? 'Sending…' : 'Get started'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* How it works */}
        <section style={s.how}>
          <div style={s.howSteps} className="how-steps">
            <div style={s.howStep}>
              <div style={s.howNum} className="how-num">1</div>
              <div style={s.howText}>Just add URLs of all the newsletters you follow</div>
            </div>
            <div style={s.howStep}>
              <div style={s.howNum} className="how-num">2</div>
              <div style={s.howText}>Your feed calmly shows everything new today</div>
            </div>
            <div style={s.howStep}>
              <div style={s.howNum} className="how-num">3</div>
              <div style={s.howText}>No endless scrolling or distracting side-quests.</div>
            </div>
          </div>
        </section>

        <footer style={s.footer}>
          © 2026 Skiptide · A quiet place to read
        </footer>
      </div>
    </div>
  )
}

const orb = (color: string): React.CSSProperties => ({
  position: 'fixed',
  borderRadius: '50%',
  filter: 'blur(80px)',
  opacity: 0.2,
  pointerEvents: 'none',
  zIndex: 0,
  background: color,
})

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    overflowX: 'hidden',
    position: 'relative',
  },
  orb1: { ...orb('radial-gradient(circle, #d4c5e8, #c4a8d4)'), width: 600, height: 600, top: -200, right: -100 },
  orb2: { ...orb('radial-gradient(circle, #b8cdb5, #a8c0a0)'), width: 500, height: 500, bottom: '10%', left: -150 },
  orb3: { ...orb('radial-gradient(circle, #e8d5c4, #d4b8a0)'), width: 350, height: 350, top: '40%', left: '40%' },
  inner: {
    position: 'relative',
    zIndex: 1,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '28px 48px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  logo: {
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: '0.01em',
    color: 'var(--accent)',
  },
  logoSpan: {
    fontStyle: 'italic',
    color: 'var(--accent-mid)',
  },
  signInBtn: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    background: 'none',
    border: '1px solid var(--border-hover)',
    borderRadius: 20,
    padding: '7px 18px',
    cursor: 'pointer',
    textDecoration: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '60px 24px 40px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: 'var(--accent-mid)',
    marginBottom: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 500,
  },
  headline: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(36px, 6vw, 62px)' as any,
    fontWeight: 300,
    lineHeight: 1.2,
    color: 'var(--text-primary)',
    marginBottom: 20,
    letterSpacing: '-0.01em',
  },
	headlineSub: {
	  fontFamily: 'Georgia, serif',
	  fontSize: 'clamp(22px, 3.5vw, 36px)' as any,
	  fontWeight: 300,
	  fontStyle: 'italic',
	  lineHeight: 1.3,
	  marginBottom: 28,
  	  // no color here — let CSS handle it
	},  
	sub: {
    fontSize: 17,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    maxWidth: 480,
    margin: '0 auto 40px',
    fontWeight: 300,
    fontFamily: 'Georgia, serif',
  },
  tryBox: {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '32px 36px',
    maxWidth: 580,
    margin: '0 auto',
    boxShadow: '0 8px 40px rgba(100,80,120,0.08)',
    textAlign: 'left',
  },
  tryRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 10,
  },
  tryInput: {
    flex: 1,
    padding: '11px 16px',
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    border: '1px solid var(--border-hover)',
    borderRadius: 10,
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  tryBtn: {
    padding: '11px 20px',
    background: 'var(--accent)',
    color: '#f5f0f8',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  tryHint: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textAlign: 'center' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  tryError: {
    fontSize: 13,
    color: '#a0392b',
    marginTop: 12,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  preview: {
    marginTop: 28,
    borderTop: '1px solid var(--border)',
    paddingTop: 24,
  },
  previewSource: {
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--accent-mid)',
    marginBottom: 16,
    fontWeight: 500,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  previewPost: {
    display: 'flex',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--accent-mid)',
    flexShrink: 0,
    marginTop: 8,
  },
  previewTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 16,
    fontWeight: 400,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  previewExcerpt: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 4,
    fontFamily: 'Georgia, serif',
    fontWeight: 300,
  },
  previewDate: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  signupPrompt: {
    marginTop: 24,
    padding: 24,
    background: 'var(--accent-bg)',
    borderRadius: 14,
    border: '1px solid var(--border)',
    textAlign: 'center' as const,
  },
  signupText: {
    fontFamily: 'Georgia, serif',
    fontSize: 18,
    fontWeight: 400,
    color: 'var(--text-primary)',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  signupSub: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 300,
  },
  signupRow: {
    display: 'flex',
    gap: 8,
    maxWidth: 360,
    margin: '0 auto',
  },
  signupInput: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    border: '1px solid var(--border-hover)',
    borderRadius: 10,
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  signupBtn: {
    padding: '10px 18px',
    background: 'var(--accent)',
    color: '#f5f0f8',
    border: 'none',
    borderRadius: 10,
    fontSize: 13,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  signupSent: {
    fontSize: 14,
    color: 'var(--accent)',
    fontFamily: 'Georgia, serif',
    lineHeight: 1.6,
  },
  how: {
    maxWidth: 720,
    margin: '60px auto 0',
    padding: '0 24px 80px',
  },
  howSteps: {
    display: 'grid',
    gap: 24,
  },
  howStep: {
    textAlign: 'center' as const,
    padding: '28px 20px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    backdropFilter: 'blur(8px)',
  },
  howNum: {
    fontFamily: 'Georgia, serif',
    fontWeight: 300,
    color: 'var(--accent-mid)',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  howText: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontWeight: 300,
    fontFamily: 'Georgia, serif',
  },
  footer: {
    textAlign: 'center' as const,
    padding: '32px',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    borderTop: '1px solid var(--border)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
}
