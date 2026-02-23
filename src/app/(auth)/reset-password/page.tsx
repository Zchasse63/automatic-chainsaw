'use client';

import { useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/dashboard'), 2000);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
            Password <span className="text-[#39FF14]">Updated</span>
          </h1>
          <p className="text-white/40 text-sm">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            New <span className="text-[#39FF14]">Password</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-label-upper text-white/40 block mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base w-full text-white text-sm outline-none"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-label-upper text-white/40 block mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-base w-full text-white text-sm outline-none"
              required
              minLength={8}
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
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs">
          <Link href="/login" className="text-[#39FF14] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
