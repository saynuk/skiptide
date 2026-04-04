import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Skiptide/1.0 (RSS Reader; +https://skiptide.com)',
  },
})

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'substack.com' && u.pathname.startsWith('/@')) {
      const username = u.pathname.slice(2).split('/')[0]
      return `https://${username}.substack.com`
    }
    return url
  } catch {
    return url
  }
}

export async function discoverFeed(inputUrl: string): Promise<{
  feedUrl: string
  title: string
  description: string
  faviconUrl: string
} | null> {
  let url = inputUrl.trim()
  if (!url.startsWith('http')) url = 'https://' + url
  url = normalizeUrl(url)

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

  if (u.host.includes('substack.com')) {
    candidates.push(`${base}/feed`)
  }

  if (u.host.includes('tumblr.com')) {
    const pathParts = u.pathname.split('/').filter(Boolean)
    if (pathParts.length > 0 && u.host === 'www.tumblr.com') {
      candidates.push(`https://${pathParts[0]}.tumblr.com/rss`)
      candidates.push(`${base}/${pathParts[0]}/rss`)
    }
    candidates.push(`${base}/rss`)
  }

  if (u.host.includes('medium.com')) {
    candidates.push(`${base}/feed`)
    if (path) candidates.push(`https://medium.com/feed${path}`)
    if (path) candidates.push(`${base}/feed${path}`)
  }

  if (u.host.includes('beehiiv.com')) {
    candidates.push(`${base}/feed`)
  }

  if (u.host.includes('buttondown.email') || u.host.includes('buttondown.com')) {
    const slug = path.split('/').filter(Boolean).pop() || ''
    candidates.push(`https://buttondown.email/${slug}/rss`)
    candidates.push(`${base}/rss`)
  }

  candidates.push(`${base}/rss/`)
  candidates.push(`${base}/rss`)
  candidates.push(`${base}/feed/`)
  candidates.push(`${base}/feed`)
  candidates.push(`${base}/?feed=rss2`)
  candidates.push(`${base}${path}/feed`)
  candidates.push(`${base}${path}/rss`)
  candidates.push(`${base}${path}/rss.xml`)
  candidates.push(`${base}${path}/atom.xml`)
  candidates.push(`${base}/feed.xml`)
  candidates.push(`${base}/atom.xml`)
  candidates.push(`${base}/index.xml`)
  candidates.push(`${base}/rss.xml`)

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

function decodeEntities(text: string): string {
  return text
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&middot;/g, '\u00B7')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '\u00A9')
    .replace(/&reg;/g, '\u00AE')
    .replace(/&trade;/g, '\u2122')
    .replace(/&euro;/g, '\u20AC')
    .replace(/&pound;/g, '\u00A3')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function extractExcerpt(text: string, maxLength = 200): string {
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (stripped.length <= maxLength) return stripped
  return stripped.slice(0, maxLength).replace(/\s+\S*$/, '') + '…'
}

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
      title: decodeEntities(item.title || 'Untitled'),
      excerpt: extractExcerpt(decodeEntities(item.contentSnippet || item.content || item.summary || '')),
      url: item.link || '',
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    })).filter(item => item.url && item.guid)
  } catch {
    return []
  }
}