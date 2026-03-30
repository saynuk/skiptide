'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link href="/" style={s.logo}>
          skip<span style={{ color: '#9b87b3', fontStyle: 'italic' }}>tide</span>
        </Link>
        <p style={s.tagline}>
          A quiet, personal newspaper<br />for the writers you choose.
        </p>

        {sent ? (
          <div style={s.sentBox}>
            <div style={s.sentIcon}>✓</div>
            <p style={s.sentText}>Check your email for a sign-in link.</p>
            <p style={s.sentHint}>
              Just click it and you're in. If you don't see it within a minute, check your spam or junk folder.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={s.form}>
            <label style={s.label} htmlFor="email">
              Your email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={s.input}
              autoFocus
            />
            {error && <p style={s.error}>{error}</p>}
            <button type="submit" disabled={loading} style={s.button}>
              {loading ? 'Sending…' : 'Send me a sign-in link'}
            </button>
            <p style={s.hint}>
              No password needed. Check spam if it doesn't arrive within a minute.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'var(--bg)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    backdropFilter: 'blur(12px)',
  },
  logo: {
    display: 'block',
    fontSize: '26px',
    fontWeight: 400,
    letterSpacing: '0.01em',
    marginBottom: '10px',
    fontFamily: 'Georgia, serif',
    color: 'var(--accent)',
    textDecoration: 'none',
  },
  tagline: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '32px',
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic',
    fontWeight: 300,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  input: {
    padding: '11px 14px',
    fontSize: '15px',
    border: '1px solid var(--border-hover)',
    borderRadius: '10px',
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
  },
  button: {
    padding: '12px',
    background: 'var(--accent)',
    color: '#f5f0f8',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 500,
    marginTop: '4px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  error: {
    fontSize: '13px',
    color: '#c0392b',
  },
  sentBox: {
    textAlign: 'center',
    padding: '8px 0',
  },
  sentIcon: {
    width: '48px',
    height: '48px',
    background: 'var(--accent-bg)',
    color: 'var(--accent-mid)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    margin: '0 auto 16px',
  },
  sentText: {
    fontSize: '16px',
    color: 'var(--text-primary)',
    lineHeight: 1.6,
    marginBottom: '8px',
    fontFamily: 'Georgia, serif',
  },
  sentHint: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    lineHeight: 1.6,
  },
}
