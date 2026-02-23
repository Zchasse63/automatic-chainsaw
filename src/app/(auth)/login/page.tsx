'use client';

import { useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            Hyrox AI <span className="text-[#39FF14]">Coach</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-label-upper text-white/40 block mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base w-full text-white text-sm outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-label-upper text-white/40 block mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base w-full text-white text-sm outline-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[#39FF14] text-xs hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="text-[#FF4444] text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#39FF14] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
