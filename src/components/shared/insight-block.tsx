'use client';

import React from 'react';
import { motion } from 'motion/react';

interface InsightBlockProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: 'green' | 'cyan';
}

/**
 * Styled insight / AI-tip card with entrance animation.
 *
 * Extracted from WeeklyVolumeAnalytics.tsx `InsightBlock` component.
 *
 * Usage:
 *   <InsightBlock
 *     icon={<TrendingUp size={13} />}
 *     title="Race Prep on Track"
 *     body="Your 5-session week ..."
 *     accent="green"
 *   />
 */
export function InsightBlock({
  icon,
  title,
  body,
  accent = 'green',
}: InsightBlockProps) {
  const isGreen = accent === 'green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#1a1a1a] rounded-2xl p-4 border relative overflow-hidden ${
        isGreen ? 'border-[#39FF14]/30' : 'border-[#00F0FF]/30'
      }`}
    >
      {/* Accent glow in top-right corner */}
      <div
        className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 ${
          isGreen ? 'bg-[#39FF14]' : 'bg-[#00F0FF]'
        }`}
      />

      <div className="flex items-start gap-3 relative z-10">
        {/* Icon container with tinted background */}
        <div
          className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isGreen
              ? 'bg-[#39FF14]/20 text-[#39FF14]'
              : 'bg-[#00F0FF]/20 text-[#00F0FF]'
          }`}
        >
          {icon}
        </div>

        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              isGreen ? 'text-[#39FF14]' : 'text-[#00F0FF]'
            }`}
          >
            {title}
          </p>
          <p className="text-xs text-white/60 leading-relaxed">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}
