import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { fetchFeed } from '@/lib/feed'
import { NextResponse } from 'next/server'

const BATCH_SIZE = 5 // fetch this many feeds concurrently

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (authHeader !== `Bearer ${secret}`) {
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
  const successfulSourceIds: string[] = []
  const errors: { source_id: string; error: string }[] = []

  // Process feeds in parallel batches to avoid timeout
  for (let i = 0; i < sources.length; i += BATCH_SIZE) {
    const batch = sources.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map(async (source) => {
        const items = await fetchFeed(source.feed_url)
        if (items.length === 0) return { source_id: source.id, count: 0 }

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

        return { source_id: source.id, count: count || 0 }
      })
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const source = batch[j]
      if (result.status === 'fulfilled') {
        totalNewPosts += result.value.count
        successfulSourceIds.push(source.id)
      } else {
        console.error(`[cron] Failed to refresh source ${source.id}:`, result.reason)
        errors.push({ source_id: source.id, error: String(result.reason) })
      }
    }
  }

  // Batch-update last_fetched_at for all successful sources in one query
  if (successfulSourceIds.length > 0) {
    await supabase
      .from('sources')
      .update({ last_fetched_at: new Date().toISOString() })
      .in('id', successfulSourceIds)
  }

  return NextResponse.json({
    message: 'Feed refresh complete',
    sourcesProcessed: sources.length,
    succeeded: successfulSourceIds.length,
    failed: errors.length,
    newPosts: totalNewPosts,
    ...(errors.length > 0 && { errors }),
  })
}
