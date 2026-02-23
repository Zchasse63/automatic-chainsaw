'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDashboard } from '@/hooks/use-dashboard';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export function AppHeader() {
  const router = useRouter();
  const { data } = useDashboard();

  const email = data?.email ?? '';
  const displayName = data?.profile?.display_name;
  const initial = (displayName?.[0] ?? email?.[0] ?? 'U').toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-end px-6 pt-12 pb-3 pointer-events-none">
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="pointer-events-auto w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white transition-colors hover:bg-white/15"
            aria-label="Profile settings"
          >
            {initial}
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-[#1a1a1a] border-white/5 text-white w-72"
          showCloseButton
        >
          <SheetHeader>
            <SheetTitle className="text-white font-black uppercase tracking-tighter">
              Profile
            </SheetTitle>
            <SheetDescription className="text-white/40">
              Account settings
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 space-y-6 flex-1">
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center">
                <User size={20} className="text-[#39FF14]" />
              </div>
              <div className="min-w-0 flex-1">
                {displayName && (
                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                )}
                <p className="text-xs text-white/40 truncate">{email || 'No email'}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} />
              <span className="text-sm font-bold">Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
