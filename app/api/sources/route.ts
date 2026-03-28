import { createClient } from '@/lib/supabase/server'
import { discoverFeed } from '@/lib/feed'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await request.json()
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

// Patreon feeds are private and require a personal auth token
if (new URL(url).hostname.includes('patreon.com')) {
  return NextResponse.json(
    {
      error:
      "Patreon feeds are private and can't be added by URL. If you're a paying member, log in to Patreon, go to the creator's page, open the Membership tab, and look for \"Private RSS link.\" Copy that URL and paste it here instead.",
    },
    { status: 422 }
  )
}

  // Discover the feed
  const discovered = await discoverFeed(url)
  if (!discovered) {
    return NextResponse.json(
      { error: "We couldn't find a feed at that address. Try pasting the exact URL of the newsletter or blog." },
      { status: 422 }
    )
  }

  // Upsert source (in case it already exists from another user)
  const { data: source, error: sourceError } = await supabase
    .from('sources')
    .upsert({
      homepage_url: url,
      feed_url: discovered.feedUrl,
      title: discovered.title,
      description: discovered.description,
      favicon_url: discovered.faviconUrl,
    }, { onConflict: 'feed_url' })
    .select()
    .single()

  if (sourceError || !source) {
    return NextResponse.json({ error: 'Could not save source' }, { status: 500 })
  }

  // Subscribe user to this source
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({ user_id: user.id, source_id: source.id }, { onConflict: 'user_id,source_id' })

  if (subError) {
    return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 })
  }

  // Immediately fetch posts for this source
  const { fetchFeed } = await import('@/lib/feed')
  const feedItems = await fetchFeed(discovered.feedUrl)

  if (feedItems.length > 0) {
    await supabase.from('posts').upsert(
      feedItems.map(item => ({
        source_id: source.id,
        guid: item.guid,
        title: item.title,
        excerpt: item.excerpt,
        url: item.url,
        published_at: item.publishedAt.toISOString(),
      })),
      { onConflict: 'source_id,guid', ignoreDuplicates: true }
    )

    await supabase
      .from('sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', source.id)
  }

  const posts = feedItems.map(item => ({
  source_id: source.id,
  guid: item.guid,
  title: item.title,
  excerpt: item.excerpt,
  url: item.url,
  published_at: item.publishedAt.toISOString(),
}))

return NextResponse.json({ source, posts, postCount: posts.length })
}
