import { NextRequest, NextResponse } from 'next/server';
import { discoverFeed } from '@/lib/feeds';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    const found = await discoverFeed(url);
    return NextResponse.json(found);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to resolve feed' }, { status: 400 });
  }
}
