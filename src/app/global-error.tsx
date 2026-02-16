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
      <body className="font-body antialiased bg-[#0A0A0F]">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <h2 className="text-xl font-bold text-white">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-400">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-[#D4FF00] text-black text-sm font-bold rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
