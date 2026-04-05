import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message } = await request.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  // Store in DB
  const { error } = await supabase
    .from('feedback')
    .insert({
      user_id: user.id,
      email: user.email,
      message: message.trim(),
    })

  if (error) {
    return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 })
  }

  // Email via Resend if configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Skiptide Feedback <feedback@skiptide.com>',
        to: process.env.FEEDBACK_EMAIL || 'adam@skiptide.com',
        subject: `Skiptide feedback from ${user.email}`,
        text: `From: ${user.email}\n\n${message.trim()}`,
      }),
    }).catch(() => {}) // Don't fail if email fails
  }

  return NextResponse.json({ success: true })
}
