'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

type Post = {
  id: string;
  title: string | null;
  excerpt: string | null;
  url: string;
  published_at: string | null;
  source_id: string;
  sources: { title: string | null } | null;
  read: boolean;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError('Please log in to see your newspaper.');
      return;
    }
    // Select posts from the last 7 days for the user's subscriptions
    const { data, error: err } = await supabase
      .from('posts')
      .select('id,title,excerpt,url,published_at,source_id,sources(title),read_states!left(user_id)')
      .order('published_at', { ascending: false })
      .gte('published_at', new Date(Date.now()-7*24*60*60*1000).toISOString());
    if (err) { setError(err.message); setLoading(false); return; }
    // Filter by posts whose source_id is in user's subscriptions
    const { data: subs } = await supabase.from('subscriptions').select('source_id');
    const subSet = new Set((subs||[]).map(s => s.source_id));
    const list = (data||[])
      .filter(p => subSet.has(p.source_id))
      .map((p: any) => ({
        ...p,
        read: Array.isArray(p.read_states) && p.read_states.length > 0
      }));
    setPosts(list as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('read_states').insert({ user_id: user.id, post_id: id }).select();
    setPosts(prev => prev.map(p => p.id === id ? { ...p, read: true } : p));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Today / This Week</h1>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && posts.length === 0 && (
        <div className="text-gray-600">No posts yet. Try <a className="underline" href="/add">adding a source</a> and then trigger a refresh.</div>
      )}
      <div className="space-y-4">
        {posts.map(p => (
          <article key={p.id} className="rounded-xl bg-white p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">{p.sources?.title ?? 'Unknown source'}</div>
              <div className="text-xs text-gray-400">{p.published_at ? new Date(p.published_at).toLocaleString() : ''}</div>
            </div>
            <a href={p.url} target="_blank" rel="noreferrer" className="block mt-1">
              <h2 className="text-lg font-medium">{p.title ?? '(untitled)'}</h2>
              {p.excerpt && <p className="text-gray-600 mt-1">{p.excerpt}</p>}
            </a>
            <div className="mt-2 flex gap-3">
              <button onClick={() => markRead(p.id)} className={"text-sm " + (p.read ? "text-gray-400" : "text-blue-600 underline")}>
                {p.read ? "Read" : "Mark read"}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="pt-6 border-t">
        <a className="underline" href="/add">Add source</a> · <a className="underline" href="/login">Account</a>
      </div>
    </div>
  );
}
