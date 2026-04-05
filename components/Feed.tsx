'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/lib/useTheme'
import AddWriterModal from './AddWriterModal'
import ManagePeopleModal from './ManagePeopleModal'
import '@/app/feed.css'
import FeedbackModal from './FeedbackModal'

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
  const [showManage, setShowManage] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [skipQuery, setSkipQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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
    setSkipQuery('')
    setDropdownOpen(false)
  }

  const activeSource = activeSourceId ? sources.find(s => s.id === activeSourceId) : null

  function openManage() {
    setShowMobileMenu(false)
    setShowManage(true)
  }

  return (
    <div className="feed-page">

      {/* Desktop side tab */}
      <div className="sidetab">
        <a href="/about" className="sidetab-item">
          <div className="sidetab-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <span className="sidetab-label">About</span>
        </a>
        <div className="sidetab-item" onClick={openManage} style={{ cursor: 'pointer' }}>
          <div className="sidetab-icon">
            <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </div>
          <span className="sidetab-label">People I follow</span>
        </div>
        <a href="https://buymeacoffee.com/saynuk/membership" target="_blank" rel="noopener noreferrer" className="sidetab-item">
          <div className="sidetab-icon">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <span className="sidetab-label">Support Skiptide</span>
        </a>
		<div className="sidetab-item" onClick={() => setShowFeedback(true)} style={{ cursor: 'pointer' }}>
		  <div className="sidetab-icon">
			<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
		  </div>
		  <span className="sidetab-label">Share feedback</span>
		</div>
		<div className="sidetab-item" onClick={handleSignOut} style={{ cursor: 'pointer' }}>
          <div className="sidetab-icon">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <span className="sidetab-label">Sign out</span>
        </div>
      </div>

      <div className="feed-container">
        <div className="feed-topbar">
          <div className="feed-logo">
            skip<span className="logoSpan">tide</span>
          </div>
          <div className="feed-topbar-right">
            <button className="feed-add-btn" onClick={() => setShowModal(true)}>+ Add</button>
		<button className="feed-theme-btn" onClick={toggle} title="Toggle theme">
		  {theme === 'dark' ? (
			<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round">
			  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
			</svg>
		  ) : (
			<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round">
			  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
			</svg>
		  )}
		</button>            
		<button className="mobile-menu-btn" onClick={() => setShowMobileMenu(true)}>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        {sources.length > 0 && (
          <div className="skip-wrap" ref={skipRef}>

            {/* Pill shown when a source is active */}
            {activeSource ? (
              <div className="skip-pill">
                <span className="skip-pill-name">{activeSource.title}</span>
                <button className="skip-pill-x" onClick={() => selectSource(null)}>✕</button>
              </div>
            ) : (
              <>
                <input
                  className="skip-input"
                  value={skipQuery}
                  placeholder="Skip to…"
                  onChange={e => { setSkipQuery(e.target.value); setDropdownOpen(true) }}
                  onFocus={() => setDropdownOpen(true)}
                />
                {dropdownOpen && (
                  <div className="skip-dropdown">
                    {!skipQuery && (
                      <>
                        <div
                          className="skip-dropdown-item active"
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
                          className="skip-dropdown-item"
                          onClick={() => selectSource(source.id)}
                        >
                          <span>{source.title}</span>
                          <span className="skip-unread-badge">{unread > 0 ? `${unread} unread` : ''}</span>
                        </div>
                      )
                    })}
                    {filteredSources.length === 0 && (
                      <div className="skip-dropdown-empty">No matches</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {sources.length === 0 && (
          <div className="feed-empty-state">
            <p className="feed-empty-title">Your feed is empty</p>
            <p className="feed-empty-hint">
              Add anyone who publishes online — Substack, Medium, Ghost, Tumblr, or most blogs. Paste their URL and we'll find their posts automatically.
            </p>
            <button className="feed-empty-btn" onClick={() => setShowModal(true)}>
              Add your first writer
            </button>
          </div>
        )}

        {sources.length > 0 && (
          <>
            {visiblePosts.length === 0 && (
              <div className="feed-caught-up">No posts yet from this person.</div>
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

      {showManage && (
        <ManagePeopleModal
          sources={sources}
          onClose={() => setShowManage(false)}
          onRemove={handleRemoveSource}
        />
      )}

      {/* Mobile slide-up sheet */}
      <div
        className={`mobile-overlay-dim ${showMobileMenu ? 'open' : ''}`}
        onClick={() => setShowMobileMenu(false)}
      />
      <div className={`mobile-sheet ${showMobileMenu ? 'open' : ''}`}>
        <div className="mobile-sheet-handle" />
        <a href="/about" className="mobile-sheet-link">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          About
        </a>
        <div className="mobile-sheet-link" onClick={openManage}>
          <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          People I follow
        </div>
        <a href="https://buymeacoffee.com/saynuk/membership" target="_blank" rel="noopener noreferrer" className="mobile-sheet-link">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Support Skiptide
        </a>
		<div className="mobile-sheet-link" onClick={() => { setShowMobileMenu(false); setShowFeedback(true) }}>
		  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
		  Share feedback
		</div>
        <div className="mobile-sheet-link" onClick={handleSignOut}>
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </div>
      </div>
	  
		{showFeedback && (
		  <FeedbackModal onClose={() => setShowFeedback(false)} />
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
