'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          skip<span style={{ color: '#1D9E75' }}>tide</span>
        </div>
        <p style={styles.tagline}>
          A quiet, personal newspaper<br />for the writers you choose.
        </p>

        {sent ? (
          <div style={styles.sentBox}>
            <div style={styles.sentIcon}>✓</div>
            <p style={styles.hint}>
  			We'll email you a link — no password ever needed. <strong>Also check your spam folder</strong>.
			</p>
            <p style={styles.sentHint}>
  			Just click the link and you're in. If you don't see it, check your spam or junk folder.
			</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label} htmlFor="email">
              Your email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending…' : 'Send me a sign-in link'}
            </button>
            <p style={styles.hint}>
              We'll email you a link — no password ever needed.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'var(--bg-secondary)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: 'var(--bg)',
    border: '0.5px solid var(--border)',
    borderRadius: '16px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: 500,
    letterSpacing: '-0.5px',
    marginBottom: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  tagline: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '32px',
    fontFamily: 'Georgia, serif',
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
    border: '0.5px solid var(--border-hover)',
    borderRadius: '8px',
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
  },
  button: {
    padding: '12px',
    background: '#1D9E75',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
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
    background: '#E1F5EE',
    color: '#1D9E75',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    margin: '0 auto 16px',
  },
  sentText: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    lineHeight: 1.6,
    marginBottom: '8px',
  },
  sentHint: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
}
