'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/supabase-js';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddSourcePage() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);

  const resolveFeed = async () => {
    setStatus('Resolving…');
    setFeedUrl(null);
    const res = await fetch('/api/sources/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input })
    });
    const data = await res.json();
    if (!res.ok) { setStatus(data.error || 'Could not find a feed'); return; }
    setFeedUrl(data.feed_url);
    setStatus(`Found: ${data.title || data.feed_url}`);
  };

  const follow = async () => {
    setStatus('Following…');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus('Please log in first.'); return; }
    // Ensure source exists (insert if missing)
    const { data: sources, error: sErr } = await supabase
      .from('sources')
      .upsert({ feed_url: feedUrl!, homepage_url: input }, { onConflict: 'feed_url' })
      .select()
      .limit(1);
    if (sErr || !sources || sources.length === 0) { setStatus(sErr?.message || 'Could not save source'); return; }
    const sourceId = sources[0].id;
    const { error: subErr } = await supabase.from('subscriptions').insert({ user_id: user.id, source_id: sourceId });
    if (subErr) { setStatus(subErr.message); return; }
    setStatus('Subscribed. You can trigger a refresh below.');
  };

  const triggerRefresh = async () => {
    if (!feedUrl) { setStatus('Resolve a feed first.'); return; }
    setStatus('Refreshing…');
    const res = await fetch('/api/worker/poll-source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feed_url: feedUrl })
    });
    if (!res.ok) {
      const j = await res.json().catch(()=>({}));
      setStatus(j.error || 'Refresh failed'); return;
    }
    setStatus('Refreshed. Go back to Home to see new posts.');
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-semibold">Add a source</h1>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Paste a creator/page URL (Substack, Ghost, Medium, Patreon, Blog)…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
      />
      <div className="flex gap-2">
        <button onClick={resolveFeed} className="px-3 py-2 rounded-lg bg-black text-white">Find feed</button>
        {feedUrl && <button onClick={follow} className="px-3 py-2 rounded-lg border">Follow</button>}
        {feedUrl && <button onClick={triggerRefresh} className="px-3 py-2 rounded-lg border">Refresh now</button>}
      </div>
      {status && <div className="text-sm text-gray-700">{status}</div>}
      <p className="text-sm text-gray-500">Tip: most Substacks work if you paste their homepage; we auto-detect the RSS feed.</p>
    </div>
  );
}
