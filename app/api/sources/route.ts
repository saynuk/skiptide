import { createClient } from '@/lib/supabase/server'
import { discoverFeed } from '@/lib/feed'
import { NextResponse } from 'next/server'

const SOURCE_LIMIT = 10

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

  // Check source limit
  const { count } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count !== null && count >= SOURCE_LIMIT) {
    return NextResponse.json(
      { error: `You've reached the limit of ${SOURCE_LIMIT} sources. We'll be adding more options soon.`, limitReached: true },
      { status: 403 }
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

  // Upsert source
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

  // Subscribe user
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({ user_id: user.id, source_id: source.id }, { onConflict: 'user_id,source_id' })

  if (subError) {
    return NextResponse.json({ error: 'Could not subscribe' }, { status: 500 })
  }

  // Fetch initial posts
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
