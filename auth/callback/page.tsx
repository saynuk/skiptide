'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // This reads the code from the URL and creates the session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error('Auth exchange error:', error.message);
          router.replace('/login'); // fallback
          return;
        }
        // Success: go home
        router.replace('/');
      } catch (e) {
        console.error(e);
        router.replace('/login');
      }
    })();
  }, [router]);

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold">Signing you in…</h1>
      <p className="text-gray-600 mt-2">One moment.</p>
    </div>
  );
}
