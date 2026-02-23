'use client';

import { useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
            Check Your <span className="text-[#39FF14]">Email</span>
          </h1>
          <p className="text-white/40 text-sm">
            We sent a password reset link to <span className="text-white/70">{email}</span>. Check your inbox and follow the link to reset your password.
          </p>
          <Link
            href="/login"
            className="inline-block text-[#39FF14] text-sm hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            Reset <span className="text-[#39FF14]">Password</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Enter your email and we&apos;ll send you a reset link.
          </p>
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

          {error && (
            <p className="text-[#FF4444] text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs">
          Remember your password?{' '}
          <Link href="/login" className="text-[#39FF14] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
