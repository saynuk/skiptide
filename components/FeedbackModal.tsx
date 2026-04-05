'use client'

import { useState } from 'react'

type Props = {
  onClose: () => void
}

export default function FeedbackModal({ onClose }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      return
    }

    setSent(true)
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.title}>Share feedback</div>
          <button style={s.close} onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div style={s.sentBox}>
            <div style={s.sentCheck}>✓</div>
            <p style={s.sentText}>Thanks — your feedback goes straight to Adam.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            <p style={s.hint}>
              Something broken? Something delightful? Tell Adam directly — this goes nowhere else.
            </p>
            <textarea
              style={s.textarea}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What's on your mind…"
              rows={5}
              autoFocus
              disabled={loading}
            />
            {error && <p style={s.error}>{error}</p>}
            <div style={s.actions}>
              <button type="button" style={s.cancelBtn} onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" style={s.submitBtn} disabled={loading || !message.trim()}>
                {loading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(45,37,53,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modal: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: '0.5px solid var(--border)',
  },
  title: {
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  close: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: 0,
  },
  form: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontFamily: "'Fraunces', Georgia, serif",
    fontStyle: 'italic',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    fontFamily: "'Fraunces', Georgia, serif",
    border: '1px solid var(--border-hover)',
    borderRadius: 12,
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'vertical' as const,
    lineHeight: 1.6,
  },
  error: {
    fontSize: 13,
    color: '#a03030',
  },
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    background: 'none',
    border: '0.5px solid var(--border-hover)',
    borderRadius: 10,
    padding: '9px 18px',
    fontSize: 14,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  submitBtn: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 10,
    padding: '9px 20px',
    fontSize: 14,
    fontWeight: 500,
    color: '#f5f0f8',
    cursor: 'pointer',
  },
  sentBox: {
    padding: '32px 20px',
    textAlign: 'center' as const,
  },
  sentCheck: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'var(--accent-bg)',
    color: 'var(--accent-mid)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    margin: '0 auto 16px',
  },
  sentText: {
    fontSize: 15,
    color: 'var(--text-primary)',
    fontFamily: "'Fraunces', Georgia, serif",
    lineHeight: 1.6,
  },
}
