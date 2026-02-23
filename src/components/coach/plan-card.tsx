'use client';

import { motion } from 'motion/react';
import { Calendar, ChevronRight, Dumbbell, Zap } from 'lucide-react';
import { useState } from 'react';
import type { TrainingPlanInput } from '@/lib/coach/training-plan-schema';
import { PlanReviewModal } from './plan-review-modal';

interface PlanCardProps {
  /** The raw assistant message text that contains the plan */
  messageContent: string;
  /** Conversation ID for linking the plan */
  conversationId: string | null;
}

/** Detect if a message likely contains a training plan */
export function isPlanMessage(text: string): boolean {
  // Must be long enough to contain a structured plan
  if (text.length < 800) return false;

  // Must mention at least 2 distinct weeks (e.g. "Week 1" and "Week 2")
  const weekMatches = text.match(/\bweek\s*(\d+)/gi) ?? [];
  const distinctWeeks = new Set(weekMatches.map((m) => m.replace(/\D/g, '')));
  if (distinctWeeks.size < 2) return false;

  // Must have multiple day/session references — structured plan, not casual mention
  const dayPattern = /\b(day\s*[1-7]|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
  const dayMatches = text.match(dayPattern) ?? [];
  return dayMatches.length >= 3;
}

/** Extract a quick summary from plan text */
function extractSummary(text: string): {
  weekCount: number;
  sessionTypes: string[];
  planTitle: string;
} {
  // Try to find week count
  const weekMatches = text.match(/(\d+)\s*[-–]?\s*week/i);
  const weekCount = weekMatches ? parseInt(weekMatches[1], 10) : 0;

  // Try to find unique session types
  const sessionKeywords = ['run', 'hiit', 'strength', 'simulation', 'recovery', 'station practice'];
  const sessionTypes = sessionKeywords.filter((kw) =>
    text.toLowerCase().includes(kw)
  );

  // Try to find plan title from first heading or first bold text
  const headingMatch = text.match(/^#+\s*(.+)/m) || text.match(/\*\*(.+?)\*\*/);
  const planTitle = headingMatch ? headingMatch[1].trim() : 'Training Plan';

  return { weekCount, sessionTypes, planTitle };
}

export function PlanCard({ messageContent, conversationId }: PlanCardProps) {
  const [showModal, setShowModal] = useState(false);
  const summary = extractSummary(messageContent);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-3 bg-gradient-to-br from-[#39FF14]/5 to-transparent border border-[#39FF14]/20 rounded-2xl overflow-hidden"
      >
        {/* Summary header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full bg-[#39FF14] flex items-center justify-center">
              <Zap size={9} className="text-black" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#39FF14]">
              Training Plan
            </span>
          </div>
          <h4 className="text-sm font-bold text-white truncate">
            {summary.planTitle}
          </h4>
          <div className="flex items-center gap-3 mt-1.5">
            {summary.weekCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-white/40">
                <Calendar size={10} />
                {summary.weekCount} weeks
              </span>
            )}
            {summary.sessionTypes.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-white/40">
                <Dumbbell size={10} />
                {summary.sessionTypes.slice(0, 3).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Review & Accept button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-between px-4 py-3 border-t border-[#39FF14]/10 bg-[#39FF14]/5 hover:bg-[#39FF14]/10 transition-colors"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#39FF14]">
            Review & Accept Plan
          </span>
          <ChevronRight size={14} className="text-[#39FF14]" />
        </motion.button>
      </motion.div>

      {/* Full review modal */}
      {showModal && (
        <PlanReviewModal
          messageContent={messageContent}
          conversationId={conversationId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
