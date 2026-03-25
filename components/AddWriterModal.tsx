'use client'

import { useState } from 'react'

type Source = {
  id: string
  title: string
  homepage_url: string
  favicon_url: string
}

type Post = {
  id: string
  source_id: string
  title: string
  excerpt: string
  url: string
  published_at: string
}

type Props = {
  onClose: () => void
  onSourceAdded: (source: Source, posts: Post[]) => void
}

export default function AddWriterModal({ onClose, onSourceAdded }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      onSourceAdded(data.source, data.posts || [])
    } catch {
      setError('Could not connect. Please check your internet and try again.')
      setLoading(false)
    }
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.title}>Add a writer or blog</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p style={s.hint}>
          Paste any newsletter or blog link below — we'll find their posts
          automatically. Works with Substack, Medium, Ghost, and most blogs.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            style={s.input}
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="e.g. annfriedman.substack.com"
            autoFocus
            disabled={loading}
          />

          {error && <p style={s.error}>{error}</p>}

          {loading && (
            <p style={s.finding}>Looking for their feed…</p>
          )}

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={s.addBtn} disabled={loading || !url.trim()}>
              {loading ? 'Adding…' : 'Add writer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modal: {
    background: 'var(--bg)',
    border: '0.5px solid var(--border)',
    borderRadius: '14px',
    padding: '28px',
    width: '100%',
    maxWidth: '420px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  title: {
    fontSize: '17px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '2px 6px',
  },
  hint: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '18px',
    fontFamily: 'Georgia, serif',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '15px',
    border: '0.5px solid var(--border-hover)',
    borderRadius: '8px',
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    outline: 'none',
    marginBottom: '12px',
  },
  error: {
    fontSize: '13px',
    color: '#c0392b',
    marginBottom: '10px',
    lineHeight: 1.5,
  },
  finding: {
    fontSize: '13px',
    color: '#1D9E75',
    marginBottom: '10px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    background: 'none',
    border: '0.5px solid var(--border-hover)',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  addBtn: {
    background: '#1D9E75',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    cursor: 'pointer',
  },
}
