import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { QueryProvider } from '@/components/providers/query-provider';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SwipeContainer } from '@/components/layout/swipe-container';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth: middleware handles redirect, this catches edge cases
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <QueryProvider>
      <div className="relative min-h-screen bg-bg-base text-white">
        {/* Ambient glow — green top-right */}
        <div
          className="fixed top-0 right-0 w-80 h-80 glow-green opacity-[0.08] pointer-events-none z-0"
          aria-hidden="true"
        />
        {/* Ambient glow — cyan bottom-left */}
        <div
          className="fixed bottom-0 left-0 w-80 h-80 glow-cyan opacity-[0.08] pointer-events-none z-0"
          aria-hidden="true"
        />

        {/* Page content with swipe navigation */}
        <SwipeContainer>
          <main className="relative z-10 pb-safe">{children}</main>
        </SwipeContainer>

        {/* Bottom navigation */}
        <BottomNav />

        {/* Scanlines overlay */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03] scanlines z-[100]"
          aria-hidden="true"
        />
      </div>
    </QueryProvider>
  );
}
