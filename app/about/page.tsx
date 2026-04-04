import Link from 'next/link'

export default function AboutPage() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <Link href="/dashboard" style={s.logo}>
          skip<span style={s.logoSpan}>tide</span>
        </Link>

        <h1 style={s.headline}>
          Quiet the noise, and enjoy the creators you follow.
        </h1>

        <div style={s.section}>
          <div style={s.eyebrow}>Why this exists</div>
          <p style={s.p}>
            Picking up my phone for a purpose has become a 50/50 situation. I've realized how often I get distracted, needing to reset, to do the thing I intended to do when I picked the thing up.
          </p>
          <p style={s.p}>
            And while I can't stop the ads, popups, and shitposters in every site and app, I can help calm the feed for one kind of web content: independent writers and creators. <strong style={s.strong}>No algorithms, engagement bait, or infinite doomscrolling. Just the folks you follow, and a clear sense of when you are done.</strong>
          </p>
          <p style={s.p}>
            Skiptide is the quiet web.
          </p>
        </div>

        <div style={s.divider} />

        <div style={s.section}>
          <div style={s.eyebrow}>What it does</div>
          <p style={s.p}>
            Paste a link to any newsletter or blog. Skiptide finds the feed, pulls in their posts, and adds them to your personal reading list. Everything appears in one chronological feed — newest first, nothing reordered or hidden. When you've read it all, you're done. Like finishing a newspaper.
          </p>
        </div>

        <div style={s.section}>
          <div style={s.eyebrow}>What it doesn't do</div>
          <ul style={s.list}>
            {[
              'No ads',
              'No algorithm deciding what you see',
              'No tracking or selling your data',
              'No social features or engagement metrics',
              'No recommendations pushing you toward more content',
            ].map((item, i) => (
              <li key={i} style={s.listItem}>
                <span style={s.dash}>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={s.divider} />

        <div style={s.section}>
          <div style={s.eyebrow}>Who made it</div>
          <p style={s.p}>
            I'm Adam. I'm not a tech company. As a <a href="https://adam.bkry.org" target="_blank" rel="noopener noreferrer" style={s.aboutmeLink}>designer</a>, I want to make beautiful things that are useful. Skiptide is an independent project without investors, growth targets, or an exit strategy.
          </p>
        </div>

        <div style={s.supportBox}>
          <div style={{ ...s.eyebrow, marginTop: 0, marginBottom: 12 }}>Support Skiptide</div>
          <p style={{ ...s.p, marginBottom: 24, fontSize: 16 }}>
            Skiptide is free to use. If it becomes part of your reading life, consider a small contribution — it covers hosting costs and keeps the project independent.
          </p>
          <a
            href="https://buymeacoffee.com/saynuk/membership"
            target="_blank"
            rel="noopener noreferrer"
            style={s.supportBtn}
          >
            Support Skiptide
          </a>
        </div>

        <div style={s.byline}>
          Built with care in 2026 · <a href="/" style={{ color: 'inherit' }}>skiptide.com</a>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    fontFamily: "'Fraunces', Georgia, serif",
  },
  inner: {
    maxWidth: 620,
    margin: '0 auto',
    padding: '48px 24px 80px',
  },
  logo: {
    display: 'inline-block',
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 22,
    fontWeight: 400,
    fontStyle: 'italic',
    color: 'var(--accent)',
    textDecoration: 'none',
    marginBottom: 48,
  },
  logoSpan: {
    color: 'var(--accent-mid)',
  },
  headline: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 'clamp(28px, 5vw, 40px)' as any,
    fontWeight: 300,
    lineHeight: 1.25,
    color: 'var(--text-primary)',
    marginBottom: 40,
    letterSpacing: '-0.01em',
  },
  eyebrow: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--accent-mid)',
    marginTop: 48,
    marginBottom: 16,
  },
  section: {
    marginBottom: 8,
  },
  p: {
    fontSize: 17,
    lineHeight: 1.75,
    color: 'var(--text-secondary)',
    fontWeight: 300,
    marginBottom: 20,
  },
  strong: {
    fontWeight: 400,
    color: 'var(--text-primary)',
  },
  divider: {
    width: 40,
    height: 1,
    background: 'var(--border-hover)',
    margin: '48px 0',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    fontSize: 16,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    padding: '6px 0',
    fontWeight: 300,
  },
  dash: {
    color: 'var(--accent-mid)',
    flexShrink: 0,
  },
  supportBox: {
    background: 'var(--accent-bg)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '32px',
    marginTop: 48,
    textAlign: 'center' as const,
  },
  supportBtn: {
    display: 'inline-block',
    background: 'var(--accent)',
    color: '#f5f0f8',
    border: 'none',
    borderRadius: 20,
    padding: '12px 28px',
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  byline: {
    marginTop: 64,
    paddingTop: 24,
    borderTop: '0.5px solid var(--border)',
    fontSize: 13,
    color: 'var(--text-tertiary)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    lineHeight: 1.6,
  },
  aboutmeLink: {
    textDecoration: 'underline',
  },
  
}
