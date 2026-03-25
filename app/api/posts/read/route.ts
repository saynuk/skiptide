import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await request.json()
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  await supabase
    .from('read_state')
    .upsert({ user_id: user.id, post_id: postId, read_at: new Date().toISOString() },
      { onConflict: 'user_id,post_id' })

  return NextResponse.json({ success: true })
}
