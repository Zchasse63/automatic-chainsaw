'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-hyrox-yellow mx-auto" />
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
          Something went wrong
        </h2>
        <p className="font-body text-sm text-text-secondary">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button
          onClick={reset}
          className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
