import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('source_id', id)

  if (error) {
    return NextResponse.json({ error: 'Could not remove writer' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
