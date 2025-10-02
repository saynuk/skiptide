import Parser from 'rss-parser';

export async function discoverFeed(url: string): Promise<{feed_url?: string, title?: string}> {
  // If user pasted a likely feed URL, try it directly
  const directTry = await tryFeed(url);
  if (directTry) return directTry;

  // Substack convenience: /feed often works
  if (!url.endsWith('/feed')) {
    const attempt = await tryFeed(url.replace(/\/+$/, '') + '/feed');
    if (attempt) return attempt;
  }

  // Fetch HTML and look for <link rel="alternate" type="application/rss+xml" ...>
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const html = await res.text();
    const m = html.match(/<link[^>]+rel=["']alternate["'][^>]+type=["']application\/(?:rss\+xml|atom\+xml)["'][^>]*>/i);
    if (m) {
      const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
      if (href) {
        const absolute = new URL(href, url).toString();
        const d = await tryFeed(absolute);
        if (d) return d;
      }
    }
  } catch {}

  throw new Error('Feed not found. Provide a direct RSS/Atom link or a publication page with a public feed.');
}

async function tryFeed(feedUrl: string): Promise<{feed_url: string, title?: string} | null> {
  try {
    const parser = new Parser({ timeout: 10000 });
    const feed = await parser.parseURL(feedUrl);
    if (feed?.items) {
      return { feed_url: feedUrl, title: feed.title || undefined };
    }
  } catch {}
  return null;
}

export async function pollFeedOnce(feedUrl: string) {
  const parser = new Parser({ timeout: 15000 });
  const feed = await parser.parseURL(feedUrl);
  const items = (feed.items || []).map(it => ({
    guid: it.guid || it.link || '',
    title: it.title || null,
    excerpt: (it.contentSnippet || it.content || '').toString().replace(/<[^>]+>/g, '').slice(0, 400),
    url: it.link || feedUrl,
    published_at: it.isoDate || it.pubDate || null,
  }));
  return { title: feed.title || null, items };
}
