import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Skiptide/1.0 (RSS Reader; +https://skiptide.com)',
  },
})

// Attempt to discover the RSS/Atom feed URL from a given homepage URL
export async function discoverFeed(inputUrl: string): Promise<{
  feedUrl: string
  title: string
  description: string
  faviconUrl: string
} | null> {
  // Normalize URL
  let url = inputUrl.trim()
  if (!url.startsWith('http')) url = 'https://' + url

  // Known patterns for popular platforms
  const candidates = buildCandidates(url)

  for (const candidate of candidates) {
    try {
      const feed = await parser.parseURL(candidate)
      if (feed && feed.items && feed.items.length > 0) {
        const parsedUrl = new URL(url)
        return {
          feedUrl: candidate,
          title: feed.title || parsedUrl.hostname,
          description: feed.description || '',
          faviconUrl: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        }
      }
    } catch {
      // Try next candidate
    }
  }

  // Fall back to parsing the HTML for <link rel="alternate">
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Skiptide/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    const discovered = extractFeedFromHTML(html, url)
    if (discovered) {
      const feed = await parser.parseURL(discovered)
      if (feed && feed.items && feed.items.length > 0) {
        const parsedUrl = new URL(url)
        return {
          feedUrl: discovered,
          title: feed.title || parsedUrl.hostname,
          description: feed.description || '',
          faviconUrl: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        }
      }
    }
  } catch {
    // Could not discover feed
  }

  return null
}

function buildCandidates(url: string): string[] {
  const u = new URL(url)
  const base = `${u.protocol}//${u.host}`
  const path = u.pathname.replace(/\/$/, '')

  const candidates: string[] = []

  // Substack
  if (u.host.includes('substack.com')) {
    candidates.push(`${base}/feed`)
  }

  // Medium
  if (u.host.includes('medium.com')) {
    candidates.push(`${base}/feed`)
    if (path) candidates.push(`${base}/feed${path}`)
  }

  // Ghost
  candidates.push(`${base}/rss/`)
  candidates.push(`${base}/rss`)

  // Generic patterns
  candidates.push(`${base}${path}/feed`)
  candidates.push(`${base}${path}/feed/`)
  candidates.push(`${base}${path}/rss`)
  candidates.push(`${base}${path}/rss.xml`)
  candidates.push(`${base}${path}/atom.xml`)
  candidates.push(`${base}/feed`)
  candidates.push(`${base}/feed.xml`)
  candidates.push(`${base}/atom.xml`)
  candidates.push(`${base}/index.xml`)

  // Deduplicate
  return [...new Set(candidates)]
}

function extractFeedFromHTML(html: string, baseUrl: string): string | null {
  const regex = /<link[^>]+type=["'](application\/rss\+xml|application\/atom\+xml)["'][^>]*href=["']([^"']+)["']/gi
  const match = regex.exec(html)
  if (!match) return null

  const href = match[2]
  if (href.startsWith('http')) return href

  const base = new URL(baseUrl)
  return `${base.protocol}//${base.host}${href.startsWith('/') ? '' : '/'}${href}`
}

// Fetch and parse a feed, returning normalized post objects
export async function fetchFeed(feedUrl: string): Promise<Array<{
  guid: string
  title: string
  excerpt: string
  url: string
  publishedAt: Date
}>> {
  try {
    const feed = await parser.parseURL(feedUrl)
    return (feed.items || []).map(item => ({
      guid: item.guid || item.link || item.title || '',
      title: item.title || 'Untitled',
      excerpt: extractExcerpt(item.contentSnippet || item.content || item.summary || ''),
      url: item.link || '',
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    })).filter(item => item.url && item.guid)
  } catch {
    return []
  }
}

function extractExcerpt(text: string, maxLength = 200): string {
  // Strip HTML tags
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (stripped.length <= maxLength) return stripped
  return stripped.slice(0, maxLength).replace(/\s+\S*$/, '') + '…'
}
