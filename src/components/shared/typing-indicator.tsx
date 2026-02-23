'use client';

import { motion } from 'motion/react';

export const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-[#39FF14] rounded-full"
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);
