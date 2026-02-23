'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Calendar,
  MessageCircle,
  Dumbbell,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/coach', icon: MessageCircle, label: 'Coach', isFab: true },
  { href: '/workout/today', icon: Dumbbell, label: 'Workout' },
  { href: '/log', icon: ClipboardList, label: 'Log' },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide during active workout sessions (/workout/[uuid]) but NOT /workout/today
  const isActiveWorkout =
    pathname.startsWith('/workout') && pathname !== '/workout/today';

  return (
    <AnimatePresence>
      {!isActiveWorkout && (
        <motion.nav
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/80 backdrop-blur-2xl border-t border-white/5 pb-8 pt-3 px-4 z-50"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-end justify-around max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = item.href === '/workout/today'
                ? pathname === '/workout/today'
                : pathname.startsWith(item.href);

              if (item.isFab) {
                return (
                  <div key={item.href} className="relative -mt-12 flex flex-col items-center">
                    <div
                      className={`absolute inset-0 -top-2 rounded-full blur-xl transition-all duration-500 ${
                        isActive ? 'bg-[#39FF14]/50' : 'bg-[#39FF14]/20'
                      }`}
                    />
                    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                      <Link
                        href={item.href}
                        className={`relative h-16 w-16 rounded-full flex items-center justify-center border-4 border-[#0f0f0f] shadow-2xl transition-all duration-300 ${
                          isActive
                            ? 'bg-[#39FF14] text-black'
                            : 'bg-[#1a1a1a] text-white'
                        }`}
                        aria-label="AI Coach"
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <MessageCircle size={26} />
                      </Link>
                    </motion.div>
                    <span
                      className={`mt-1 text-[8px] font-bold uppercase tracking-widest transition-colors duration-200 ${
                        isActive ? 'text-[#39FF14]' : 'text-white/40'
                      }`}
                    >
                      {item.label}
                    </span>
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
                  <item.icon size={20} />
                  <span className="text-[8px] font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
