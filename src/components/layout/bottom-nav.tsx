'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, MessageSquare, Mic, BookOpen } from 'lucide-react';

interface NavItem {
  href: string;
  icon: typeof Activity;
  label: string;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Activity, label: 'Dashboard' },
  { href: '/coach', icon: MessageSquare, label: 'Coach', isFab: true },
  { href: '/log', icon: BookOpen, label: 'Log' },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide during active workout
  const isWorkout = pathname.startsWith('/workout');

  return (
    <AnimatePresence>
      {!isWorkout && (
        <motion.nav
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/80 backdrop-blur-2xl border-t border-white/5 pb-8 pt-4 px-8 flex justify-between items-center z-50"
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            if (item.isFab) {
              return (
                <div key={item.href} className="relative -mt-16">
                  <div
                    className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
                      isActive ? 'bg-[#39FF14]/50' : 'bg-[#39FF14]/20'
                    }`}
                  />
                  <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                    <Link
                      href={item.href}
                      className={`relative h-20 w-20 rounded-full flex items-center justify-center border-4 border-[#0f0f0f] shadow-2xl transition-all duration-300 ${
                        isActive
                          ? 'bg-[#39FF14] text-black'
                          : 'bg-[#1a1a1a] text-white'
                      }`}
                      aria-label="AI Coach"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isActive ? <Mic size={32} /> : <MessageSquare size={32} />}
                    </Link>
                  </motion.div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                  isActive ? 'text-[#39FF14]' : 'text-white/40'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={24} />
                <span className="text-[8px] font-bold uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
