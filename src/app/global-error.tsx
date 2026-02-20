'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-body antialiased bg-surface-0">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <h2 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
              Something went wrong
            </h2>
            <p className="font-body text-sm text-text-secondary">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-hyrox-yellow text-text-inverse text-sm font-display font-bold uppercase tracking-wider rounded-sm hover:bg-hyrox-yellow-hover transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
