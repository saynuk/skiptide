import { discoverFeed, fetchFeed } from '@/lib/feed'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { url } = await request.json()
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  const discovered = await discoverFeed(url)
  if (!discovered) {
    return NextResponse.json(
      { error: "We couldn't find a feed at that address. Try pasting the exact URL of the newsletter or blog." },
      { status: 422 }
    )
  }

  const items = await fetchFeed(discovered.feedUrl)
  const preview = items.slice(0, 4).map(item => ({
    title: item.title,
    excerpt: item.excerpt,
    url: item.url,
    publishedAt: item.publishedAt.toISOString(),
  }))

  return NextResponse.json({
    source: {
      title: discovered.title,
      feedUrl: discovered.feedUrl,
      faviconUrl: discovered.faviconUrl,
    },
    posts: preview,
  })
}
