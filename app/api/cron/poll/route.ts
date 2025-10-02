import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// This route fans out polling jobs for stale sources. On Vercel, wire a Cron to call it periodically.
// For simplicity in MVP, we just return 200; advanced fanout can be added later.
export async function GET() {
  return NextResponse.json({ ok: true, note: 'Hook up queue fan-out here in post-MVP.' });
}
