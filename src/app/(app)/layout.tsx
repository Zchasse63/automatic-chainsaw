'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from 'sonner';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/coach', icon: MessageSquare, label: 'Coach' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { href: '/performance', icon: TrendingUp, label: 'Progress' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileChecked, setProfileChecked] = useState(false);
  const isOnboarding = pathname === '/onboarding';

  useEffect(() => {
    async function checkProfile() {
      if (isOnboarding) {
        setProfileChecked(true);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        router.push('/onboarding');
        return;
      }

      setProfileChecked(true);
    }

    checkProfile();
  }, [isOnboarding, router]);

  // Onboarding page — no nav shell
  if (isOnboarding) {
    return <QueryProvider>{children}</QueryProvider>;
  }

  // Wait for profile check before rendering app
  if (!profileChecked) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-hyrox-yellow border-t-transparent rounded-full animate-spin" />
          <span className="font-body text-sm text-text-tertiary">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <QueryProvider>
    <div className="min-h-screen bg-surface-0">
      {/* Main content */}
      <main className="pb-20 md:pb-0 md:pl-64">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-surface-1 border-t border-border-default md:hidden">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                  isActive
                    ? 'text-hyrox-yellow'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-display text-[10px] uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-surface-1 border-r border-border-default">
        {/* Logo */}
        <div className="p-6 border-b border-border-default">
          <h1 className="font-display text-lg font-black uppercase tracking-wider text-text-primary">
            HYROX AI COACH
          </h1>
          <div className="caution-stripe w-full mt-2" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors font-display text-sm uppercase tracking-wider ${
                  isActive
                    ? 'bg-hyrox-yellow/10 text-hyrox-yellow border-l-2 border-hyrox-yellow'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-body)',
          },
        }}
      />
    </div>
    </QueryProvider>
  );
}
