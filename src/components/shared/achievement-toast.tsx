'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award } from 'lucide-react';

interface AchievementNotification {
  id: string;
  name: string;
}

let listeners: Array<(a: AchievementNotification) => void> = [];

/** Call this from anywhere to show an achievement toast */
export function showAchievementToast(name: string) {
  const notification: AchievementNotification = {
    id: `${Date.now()}-${Math.random()}`,
    name,
  };
  listeners.forEach((fn) => fn(notification));
}

/** Mount this component once at the app layout level */
export function AchievementToastContainer() {
  const [toasts, setToasts] = useState<AchievementNotification[]>([]);

  const addToast = useCallback((a: AchievementNotification) => {
    setToasts((prev) => [...prev, a]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== a.id));
    }, 4000);
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  return (
    <div className="fixed top-6 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-[#1a1a1a] border border-[#39FF14]/40 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(57,255,20,0.2)] pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-full bg-[#39FF14]/10 flex items-center justify-center flex-shrink-0">
              <Award size={16} className="text-[#39FF14]" />
            </div>
            <div>
              <p className="text-[9px] text-[#39FF14] font-black uppercase tracking-widest">
                Achievement Unlocked
              </p>
              <p className="text-sm font-bold text-white">{t.name}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
