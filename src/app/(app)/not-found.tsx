import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="font-mono text-6xl font-bold text-hyrox-yellow">404</p>
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
          Page Not Found
        </h2>
        <p className="font-body text-sm text-text-secondary">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
