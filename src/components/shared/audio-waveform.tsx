'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';

interface AudioWaveformProps {
  isActive: boolean;
}

const BAR_COUNT = 28;

export const AudioWaveform = ({ isActive }: AudioWaveformProps) => {
  // Pre-compute random peak heights once so they stay stable across renders
  const peaks = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => Math.random() * 36 + 8),
    []
  );

  return (
    <div className="flex items-end justify-center gap-[3px] h-12 w-full px-6">
      {peaks.map((peak, i) => (
        <motion.div
          key={i}
          className="w-1 bg-[#39FF14] rounded-full"
          animate={{
            height: isActive ? [6, peak, 6] : 6,
          }}
          transition={{
            duration: 0.45 + i * 0.01,
            repeat: Infinity,
            delay: i * 0.04,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
