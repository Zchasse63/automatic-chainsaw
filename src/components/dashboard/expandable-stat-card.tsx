'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';

interface ExpandableStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  children?: ReactNode; // Expanded chart content
  accentColor?: string;
}

export function ExpandableStatCard({
  label,
  value,
  subtitle,
  icon,
  children,
  accentColor = 'text-hyrox-yellow',
}: ExpandableStatCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      onClick={() => children && setExpanded(!expanded)}
      className={`bg-surface-1 border border-border-default rounded-lg p-4 ${children ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={accentColor}>{icon}</div>
          <div>
            <p className="font-display text-[10px] uppercase tracking-wider text-text-tertiary">
              {label}
            </p>
            <p className="font-mono text-2xl font-bold text-text-primary">
              {value}
            </p>
            {subtitle && (
              <p className="font-body text-xs text-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-text-tertiary"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-border-default mt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
