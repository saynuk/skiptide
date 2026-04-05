import { discoverFeed, fetchFeed } from '@/lib/feed'
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const RATE_LIMIT = 10 // max attempts
const WINDOW_MINUTES = 60

export async function POST(request: Request) {
  // Get IP from Vercel headers
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Use service role to bypass RLS for rate limit check
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Count recent attempts from this IP
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('try_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart)

  if (count !== null && count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later or sign up to add feeds.' },
      { status: 429 }
    )
  }

  // Log this attempt
  await supabase.from('try_attempts').insert({ ip })

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
