'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/lib/useTheme'
import AddWriterModal from './AddWriterModal'
import '@/app/feed.css'

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
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 1) return 'today'
  if (diffDays < 7) return 'week'
  return 'older'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 1) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (diffDays < 2) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' })
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
  const { theme, toggle } = useTheme()
  const supabase = createClient()

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

  const visiblePosts = activeSourceId
    ? posts.filter(p => p.source_id === activeSourceId)
    : posts

  const todayPosts = visiblePosts.filter(p => bucket(p.published_at) === 'today')
  const weekPosts = visiblePosts.filter(p => bucket(p.published_at) === 'week')
  const olderPosts = visiblePosts.filter(p => bucket(p.published_at) === 'older')

  const totalUnread = posts.filter(p => !readSet.has(p.id)).length
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
    <div className="feed-page">
      <div className="feed-container">
        <div className="feed-topbar">
          <div className="feed-logo">
            skip<span>tide</span>
          </div>
		  
        {/* About, pricing */}
		<div className="sidetab">
			<div className="about"><a href="/about">About</a></div>
			<div className="billing"><a href="https://buymeacoffee.com/saynuk/membership" traget="_blank">Billing</a></div>
		</div>
		  
          <div className="feed-topbar-right">
            <button className="feed-add-btn" onClick={() => setShowModal(true)}>+ Add a writer</button>
            <button className="feed-theme-btn" onClick={toggle} title="Toggle theme">
              {theme === 'dark' ? '☀︎' : '☾'}
            </button>
            <button className="feed-signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="skip-wrap" ref={skipRef}>
            <input
              className="skip-input"
              value={skipQuery}
              placeholder="Skip to…"
              onChange={e => { setSkipQuery(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
            />
            {activeSourceId && (
              <button className="skip-clear-btn" onClick={() => selectSource(null)}>✕</button>
            )}
            {dropdownOpen && (
              <div className="skip-dropdown">
                {!skipQuery && (
                  <>
                    <div
                      className={`skip-dropdown-item ${!activeSourceId ? 'active' : ''}`}
                      onClick={() => selectSource(null)}
                    >
                      <span>Everyone</span>
                      <span className="skip-unread-badge">{totalUnread > 0 ? `${totalUnread} unread` : ''}</span>
                    </div>
                    <div className="skip-dropdown-divider" />
                  </>
                )}
                {filteredSources.map(source => {
                  const unread = posts.filter(p => p.source_id === source.id && !readSet.has(p.id)).length
                  return (
                    <div
                      key={source.id}
                      className={`skip-dropdown-item ${activeSourceId === source.id ? 'active' : ''}`}
                      onClick={() => selectSource(source.id)}
                    >
                      <span>{source.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="skip-unread-badge">{unread > 0 ? `${unread} unread` : ''}</span>
                        <button
                          className="skip-remove-btn"
                          onClick={e => { e.stopPropagation(); handleRemoveSource(source.id) }}
                        >✕</button>
                      </div>
                    </div>
                  )
                })}
                {filteredSources.length === 0 && (
                  <div className="skip-dropdown-empty">No writers match that name</div>
                )}
              </div>
            )}
          </div>
        )}

        {sources.length === 0 && (
          <div className="feed-empty-state">
            <p className="feed-empty-title">Your feed is empty</p>
            <p className="feed-empty-hint">
              Add a writer or blog to get started. Paste any Substack, Medium,
              Ghost, or blog URL and we'll find their posts automatically.
            </p>
            <button className="feed-empty-btn" onClick={() => setShowModal(true)}>
              Add your first writer
            </button>
          </div>
        )}

        {sources.length > 0 && (
          <>
            {activeSourceName && (
              <p className="feed-filter-label">Showing: {activeSourceName}</p>
            )}

            {visiblePosts.length === 0 && (
              <div className="feed-caught-up">No posts yet from this writer.</div>
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
              <div className="feed-caught-up">
                <div className="feed-caught-up-check">✓</div>
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
    <div className="feed-section">
      <div className="feed-section-label">{label}</div>
		{posts.map((post, i) => (
		  <PostCard
			key={`${post.id}-${i}`}		  
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
  return (
    <div className="post-card" onClick={onClick}>
      <div className={`post-dot ${isRead ? 'read' : ''}`} />
      <div className="post-body">
        <div className="post-source-name">{sourceName}</div>
        <div className="post-title">{post.title}</div>
        {post.excerpt && <div className="post-excerpt">{post.excerpt}</div>}
        <div className="post-date">{formatDate(post.published_at)}</div>
      </div>
    </div>
  )
}
