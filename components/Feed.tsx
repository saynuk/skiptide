'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddWriterModal from './AddWriterModal'

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
  sources: Source[]
  posts: Post[]
  readPostIds: string[]
  userId: string
}

function bucket(dateStr: string): 'today' | 'week' | 'older' {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 1) return 'today'
  if (diffDays < 7) return 'week'
  return 'older'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 1) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  if (diffDays < 2) return 'Yesterday'
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'long' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined })
}

export default function Feed({ sources: initialSources, posts: initialPosts, readPostIds, userId }: Props) {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [readSet, setReadSet] = useState<Set<string>>(new Set(readPostIds))
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [skipQuery, setSkipQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const skipRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (skipRef.current && !skipRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markRead = useCallback(async (postId: string) => {
    if (readSet.has(postId)) return
    setReadSet(prev => new Set([...prev, postId]))
    // Fire and forget — don't await, keeps the click feeling instant
    fetch('/api/posts/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
  }, [readSet])

  function handlePostClick(post: Post) {
    markRead(post.id)
    window.open(post.url, '_blank', 'noopener,noreferrer')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleSourceAdded(source: Source, newPosts: Post[]) {
    setSources(prev => [...prev, source].sort((a, b) => a.title.localeCompare(b.title)))
    setPosts(prev => [...newPosts, ...prev])
    setShowModal(false)
  }

  async function handleRemoveSource(sourceId: string) {
    if (!confirm('Remove this writer from your feed?')) return
    await fetch(`/api/sources/${sourceId}`, { method: 'DELETE' })
    setSources(prev => prev.filter(s => s.id !== sourceId))
    if (activeSourceId === sourceId) setActiveSourceId(null)
  }

  // Filter posts by active source
  const visiblePosts = activeSourceId
    ? posts.filter(p => p.source_id === activeSourceId)
    : posts

  // Group into buckets
  const todayPosts = visiblePosts.filter(p => bucket(p.published_at) === 'today')
  const weekPosts = visiblePosts.filter(p => bucket(p.published_at) === 'week')
  const olderPosts = visiblePosts.filter(p => bucket(p.published_at) === 'older')

  const totalUnread = posts.filter(p => !readSet.has(p.id)).length

  // Skip to dropdown
  const filteredSources = sources.filter(s =>
    s.title.toLowerCase().includes(skipQuery.toLowerCase())
  )

  function selectSource(id: string | null) {
    setActiveSourceId(id)
    setSkipQuery(id ? (sources.find(s => s.id === id)?.title || '') : '')
    setDropdownOpen(false)
  }

  const activeSourceName = activeSourceId ? sources.find(s => s.id === activeSourceId)?.title : null

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Top bar */}
        <div style={s.topbar}>
          <div style={s.logo}>
            skip<span style={{ color: '#1D9E75' }}>tide</span>
          </div>
          <div style={s.topbarRight}>
            <button style={s.addBtn} onClick={() => setShowModal(true)}>
              + Add a writer
            </button>
            <button style={s.signOutBtn} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>

        {/* Skip to filter */}
        {sources.length > 0 && (
          <div style={s.skipWrap} ref={skipRef}>
            <input
              style={s.skipInput}
              value={skipQuery}
              placeholder="Skip to…"
              onChange={e => { setSkipQuery(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
            />
            {activeSourceId && (
              <button style={s.clearBtn} onClick={() => selectSource(null)}>✕</button>
            )}
            {dropdownOpen && (
              <div style={s.dropdown}>
                {!skipQuery && (
                  <>
                    <div
                      style={{ ...s.dropdownItem, ...(activeSourceId === null ? s.dropdownItemActive : {}) }}
                      onClick={() => selectSource(null)}
                    >
                      <span>Everyone</span>
                      <span style={s.unreadBadge}>{totalUnread > 0 ? `${totalUnread} unread` : ''}</span>
                    </div>
                    <div style={s.dropdownDivider} />
                  </>
                )}
                {filteredSources.map(source => {
                  const unread = posts.filter(p => p.source_id === source.id && !readSet.has(p.id)).length
                  return (
                    <div
                      key={source.id}
                      style={{ ...s.dropdownItem, ...(activeSourceId === source.id ? s.dropdownItemActive : {}) }}
                      onClick={() => selectSource(source.id)}
                    >
                      <span>{source.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={s.unreadBadge}>{unread > 0 ? `${unread} unread` : ''}</span>
                        <button
                          style={s.removeBtn}
                          onClick={e => { e.stopPropagation(); handleRemoveSource(source.id) }}
                          title="Remove writer"
                        >✕</button>
                      </div>
                    </div>
                  )
                })}
                {filteredSources.length === 0 && (
                  <div style={s.dropdownEmpty}>No writers match that name</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state — no sources yet */}
        {sources.length === 0 && (
          <div style={s.emptyState}>
            <p style={s.emptyTitle}>Your feed is empty</p>
            <p style={s.emptyHint}>
              Add a writer or blog to get started. Paste any Substack, Medium,
              Ghost, or blog URL and we'll find their posts automatically.
            </p>
            <button style={s.emptyBtn} onClick={() => setShowModal(true)}>
              Add your first writer
            </button>
          </div>
        )}

        {/* Feed */}
        {sources.length > 0 && (
          <>
            {activeSourceName && (
              <p style={s.filterLabel}>Showing: {activeSourceName}</p>
            )}

            {visiblePosts.length === 0 && (
              <div style={s.caughtUp}>No posts yet from this writer.</div>
            )}

            {todayPosts.length > 0 && (
              <PostSection label="Today" posts={todayPosts} readSet={readSet} onPostClick={handlePostClick} sources={sources} />
            )}
            {weekPosts.length > 0 && (
              <PostSection label="Earlier this week" posts={weekPosts} readSet={readSet} onPostClick={handlePostClick} sources={sources} />
            )}
            {olderPosts.length > 0 && (
              <PostSection label="Older" posts={olderPosts} readSet={readSet} onPostClick={handlePostClick} sources={sources} />
            )}

            {visiblePosts.length > 0 && visiblePosts.every(p => readSet.has(p.id)) && (
              <div style={s.caughtUp}>
                <div style={s.caughtUpCheck}>✓</div>
                You're all caught up.
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddWriterModal
          onClose={() => setShowModal(false)}
          onSourceAdded={handleSourceAdded}
        />
      )}
    </div>
  )
}

function PostSection({ label, posts, readSet, onPostClick, sources }: {
  label: string
  posts: Post[]
  readSet: Set<string>
  onPostClick: (post: Post) => void
  sources: Source[]
}) {
  return (
    <div style={s.section}>
      <div style={s.sectionLabel}>{label}</div>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          isRead={readSet.has(post.id)}
          sourceName={sources.find(s => s.id === post.source_id)?.title || ''}
          onClick={() => onPostClick(post)}
        />
      ))}
    </div>
  )
}

function PostCard({ post, isRead, sourceName, onClick }: {
  post: Post
  isRead: boolean
  sourceName: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={s.postCard}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ ...s.dot, opacity: isRead ? 0 : 1 }} />
      <div style={s.postBody}>
        <div style={s.sourceName}>{sourceName}</div>
        <div style={{ ...s.postTitle, color: hovered ? '#1D9E75' : 'var(--text-primary)' }}>
          {post.title}
        </div>
        {post.excerpt && (
          <div style={s.excerpt}>{post.excerpt}</div>
        )}
        <div style={s.postDate}>{formatDate(post.published_at)}</div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  container: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '0 20px 80px',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 0 16px',
    borderBottom: '0.5px solid var(--border)',
    marginBottom: '20px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 500,
    letterSpacing: '-0.3px',
    color: 'var(--text-primary)',
  },
  topbarRight: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  addBtn: {
    background: 'none',
    border: '0.5px solid var(--border-hover)',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '7px 4px',
  },
  skipWrap: {
    position: 'relative',
    marginBottom: '20px',
  },
  skipInput: {
    width: '100%',
    padding: '9px 36px 9px 14px',
    fontSize: '14px',
    border: '0.5px solid var(--border-hover)',
    borderRadius: '8px',
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: 'var(--bg)',
    border: '0.5px solid var(--border-hover)',
    borderRadius: '8px',
    zIndex: 50,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    maxHeight: '320px',
    overflowY: 'auto',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  dropdownItemActive: {
    color: '#0F6E56',
    background: '#E1F5EE',
  },
  dropdownDivider: {
    height: '0.5px',
    background: 'var(--border)',
  },
  dropdownEmpty: {
    padding: '12px 14px',
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
  unreadBadge: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '2px 4px',
    opacity: 0.5,
    lineHeight: 1,
  },
  filterLabel: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    marginBottom: '16px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
  },
  postCard: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '14px 0',
    borderBottom: '0.5px solid var(--border)',
    cursor: 'pointer',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#1D9E75',
    flexShrink: 0,
    marginTop: '7px',
    transition: 'opacity 0.3s',
  },
  postBody: {
    flex: 1,
    minWidth: 0,
  },
  sourceName: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    marginBottom: '3px',
  },
  postTitle: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.4,
    marginBottom: '5px',
    transition: 'color 0.15s',
    fontFamily: 'Georgia, serif',
  },
  excerpt: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
    marginBottom: '5px',
    fontFamily: 'Georgia, serif',
  },
  postDate: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 500,
    marginBottom: '12px',
    color: 'var(--text-primary)',
  },
  emptyHint: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: '24px',
    maxWidth: '340px',
    margin: '0 auto 24px',
    fontFamily: 'Georgia, serif',
  },
  emptyBtn: {
    background: '#1D9E75',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '11px 22px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  caughtUp: {
    textAlign: 'center',
    padding: '48px 0 16px',
    color: 'var(--text-tertiary)',
    fontSize: '14px',
    lineHeight: 1.8,
  },
  caughtUpCheck: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#E1F5EE',
    color: '#1D9E75',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    margin: '0 auto 12px',
  },
}
