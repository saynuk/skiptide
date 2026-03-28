import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { fetchFeed } from '@/lib/feed'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: sources, error } = await supabase
    .from('sources')
    .select('id, feed_url')
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!sources || sources.length === 0) {
    return NextResponse.json({ message: 'No sources found', count: 0 })
  }

  let totalNewPosts = 0

  for (const source of sources) {
    try {
      const items = await fetchFeed(source.feed_url)
      if (items.length === 0) continue

      const { count } = await supabase
        .from('posts')
        .upsert(
          items.map(item => ({
            source_id: source.id,
            guid: item.guid,
            title: item.title,
            excerpt: item.excerpt,
            url: item.url,
            published_at: item.publishedAt.toISOString(),
          })),
          { onConflict: 'source_id,guid', ignoreDuplicates: true, count: 'exact' }
        )

      totalNewPosts += count || 0

      await supabase
        .from('sources')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', source.id)
    } catch {
      // Continue with other sources if one fails
    }
  }

  return NextResponse.json({
    message: 'Feed refresh complete',
    sourcesProcessed: sources.length,
    newPosts: totalNewPosts,
  })
}
