import { createClient } from '@/lib/supabase/server'
import { fetchFeed } from '@/lib/feed'
import { NextResponse } from 'next/server'

// This route is called by Vercel Cron every 30 minutes
// Configured in vercel.json
export async function GET(request: Request) {
  // Simple auth check — Vercel sends this header for cron jobs
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all sources that haven't been fetched in the last 25 minutes
  const cutoff = new Date(Date.now() - 25 * 60 * 1000).toISOString()
  const { data: sources } = await supabase
    .from('sources')
    .select('id, feed_url, last_fetched_at')
    .or(`last_fetched_at.is.null,last_fetched_at.lt.${cutoff}`)
    .limit(50) // Process in batches to stay within function timeout

  if (!sources || sources.length === 0) {
    return NextResponse.json({ message: 'No sources to update', updated: 0 })
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
