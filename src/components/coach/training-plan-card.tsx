'use client';

import { CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { PlanReviewModal } from './plan-review-modal';
import type { TrainingPlanInput } from '@/lib/coach/training-plan-schema';

interface TrainingPlanCardProps {
  messageContent: string;
  conversationId?: string;
}

export function TrainingPlanCard({
  messageContent,
  conversationId,
}: TrainingPlanCardProps) {
  const [extracting, setExtracting] = useState(false);
  const [plan, setPlan] = useState<TrainingPlanInput | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    setExtracting(true);
    setError(null);

    try {
      const res = await fetch('/api/training-plans/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageContent }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to extract plan');
      }

      const { plan: extracted } = await res.json();
      setPlan(extracted);
      setShowReview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  }

  return (
    <>
      <div className="mt-3 flex items-center gap-3 p-3 bg-surface-2 border border-border-default rounded-sm">
        <CalendarDays className="h-5 w-5 text-hyrox-yellow flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-display text-xs uppercase tracking-wider text-text-secondary">
            Training plan detected
          </p>
          {error && (
            <p className="font-body text-xs text-semantic-error mt-1">
              {error}
            </p>
          )}
        </div>
        <Button
          onClick={handleExtract}
          disabled={extracting}
          size="sm"
          className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs"
        >
          {extracting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Review & Accept'
          )}
        </Button>
      </div>

      {plan && (
        <PlanReviewModal
          open={showReview}
          onClose={() => setShowReview(false)}
          plan={plan}
          conversationId={conversationId}
        />
      )}
    </>
  );
}
