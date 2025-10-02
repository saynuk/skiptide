import { NextRequest, NextResponse } from 'next/server';
import { pollFeedOnce } from '@/lib/feeds';

export const runtime = 'nodejs';

// This route polls a single feed and upserts into Supabase via service role
export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }
  const { feed_url, source_id } = await req.json();
  if (!feed_url) return NextResponse.json({ error: 'Missing feed_url' }, { status: 400 });
  try {
    const { items } = await pollFeedOnce(feed_url);
    // upsert posts
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(items.map(it => ({
        source_id,
        guid: it.guid || it.url,
        title: it.title,
        excerpt: it.excerpt,
        url: it.url,
        published_at: it.published_at ? new Date(it.published_at).toISOString() : null
      })))
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: `DB upsert failed: ${txt}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Polling failed' }, { status: 500 });
  }
}
