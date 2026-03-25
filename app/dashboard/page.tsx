import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Feed from '@/components/Feed'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load user's sources
  const { data: sources } = await supabase
    .from('sources')
    .select(`
      id,
      title,
      homepage_url,
      favicon_url,
      subscriptions!inner(user_id)
    `)
    .eq('subscriptions.user_id', user.id)
    .order('title')

  // Load posts from those sources
  const sourceIds = (sources || []).map((s: { id: string }) => s.id)

  let posts: any[] = []
  if (sourceIds.length > 0) {
    const { data } = await supabase
      .from('posts')
      .select('id, source_id, title, excerpt, url, published_at')
      .in('source_id', sourceIds)
      .order('published_at', { ascending: false })
      .limit(500)
    posts = data || []
  }

  // Load read state
  const { data: readItems } = await supabase
    .from('read_state')
    .select('post_id')
    .eq('user_id', user.id)

  const readPostIds = new Set((readItems || []).map((r: { post_id: string }) => r.post_id))

  return (
    <Feed
      sources={sources || []}
      posts={posts}
      readPostIds={[...readPostIds]}
      userId={user.id}
    />
  )
}
