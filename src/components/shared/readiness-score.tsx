'use client';

import { motion } from 'motion/react';

interface ReadinessScoreProps {
  score: number;
}

export const ReadinessScore = ({ score }: ReadinessScoreProps) => (
  <div className="relative h-24 w-24 flex items-center justify-center">
    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
      <circle
        cx="48"
        cy="48"
        r="44"
        stroke="currentColor"
        strokeWidth="4"
        fill="transparent"
        className="text-white/5"
      />
      <motion.circle
        cx="48"
        cy="48"
        r="44"
        stroke="currentColor"
        strokeWidth="6"
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={276}
        initial={{ strokeDashoffset: 276 }}
        animate={{ strokeDashoffset: 276 - (276 * score) / 100 }}
        className="text-[#39FF14]"
        transition={{ duration: 1.8, ease: 'easeOut' }}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-2xl font-bold text-white leading-none">
        {score}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 mt-1">
        Ready
      </span>
    </div>
  </div>
);
