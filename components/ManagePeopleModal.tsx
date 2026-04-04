'use client'

import { useState } from 'react'

type Source = {
  id: string
  title: string
  homepage_url: string
  favicon_url: string
}

type Props = {
  sources: Source[]
  onClose: () => void
  onRemove: (sourceId: string) => void
}

export default function ManagePeopleModal({ sources, onClose, onRemove }: Props) {
  const [confirming, setConfirming] = useState<string | null>(null)

  function handleRemove(id: string) {
    if (confirming === id) {
      onRemove(id)
      setConfirming(null)
    } else {
      setConfirming(id)
    }
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.modal}>
        <div style={s.header}>
          <div style={s.title}>People you follow</div>
          <button style={s.done} onClick={onClose}>Done</button>
        </div>

        {sources.length === 0 && (
          <div style={s.empty}>You're not following anyone yet.</div>
        )}

        <div style={s.list}>
          {sources.map(source => (
            <div key={source.id} style={s.row}>
              <div style={s.rowInfo}>
                <div style={s.rowName}>{source.title}</div>
                <div style={s.rowUrl}>{source.homepage_url.replace(/^https?:\/\//, '')}</div>
              </div>
              <button
                style={{
                  ...s.removeBtn,
                  ...(confirming === source.id ? s.removeBtnConfirm : {}),
                }}
                onClick={() => handleRemove(source.id)}
              >
                {confirming === source.id ? 'Tap again to confirm' : 'Remove'}
              </button>
            </div>
          ))}
        </div>

        {sources.length > 0 && (
          <p style={s.hint}>
            Removed people can be re-added anytime by pasting their URL.
          </p>
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
    maxWidth: 480,
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: '0.5px solid var(--border)',
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  done: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: 0,
  },
  list: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '0.5px solid var(--border)',
    gap: 12,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 15,
    color: 'var(--text-primary)',
    marginBottom: 2,
    fontFamily: "'Fraunces', Georgia, serif",
  },
  rowUrl: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  removeBtn: {
    background: 'none',
    border: '0.5px solid var(--border-hover)',
    borderRadius: 8,
    padding: '5px 12px',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  },
  removeBtnConfirm: {
    color: '#a03030',
    borderColor: '#a03030',
    background: 'rgba(160,48,48,0.06)',
  },
  empty: {
    padding: '32px 20px',
    fontSize: 14,
    color: 'var(--text-tertiary)',
    textAlign: 'center' as const,
  },
  hint: {
    padding: '12px 20px 16px',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    lineHeight: 1.5,
    flexShrink: 0,
    borderTop: '0.5px solid var(--border)',
  },
}
