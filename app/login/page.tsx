'use client';
import { Auth, ThemeSupa } from '@supabase/auth-ui-react';
import { createBrowserClient } from '@supabase/supabase-js';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Account</h1>
      <Auth
        supabaseClient={supabase}
        providers={[]}
        appearance={{ theme: ThemeSupa }}
        view="sign_in"
        showLinks={true}
      />
      <p className="text-sm text-gray-500 mt-4">Use email sign-in (magic link). No passwords to remember.</p>
    </div>
  );
}
