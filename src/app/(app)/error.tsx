'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#FF4444]/10 border border-[#FF4444]/30 flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={28} className="text-[#FF4444]" />
        </div>
        <h2 className="text-xl font-black italic tracking-tighter uppercase text-white mb-2">
          Something Went Wrong
        </h2>
        <p className="text-white/40 text-sm mb-6">
          An unexpected error occurred. Try again or go back to the dashboard.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-[#39FF14] text-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            Try Again
          </button>
          <a
            href="/dashboard"
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest text-center hover:text-white transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
