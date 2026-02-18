import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CoachStore {
  activeConversationId: string | null;
  lastConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  clearConversation: () => void;
}

export const useCoachStore = create<CoachStore>()(
  persist(
    (set) => ({
      activeConversationId: null,
      lastConversationId: null,
      setActiveConversation: (id) =>
        set({
          activeConversationId: id,
          lastConversationId: id ?? null,
        }),
      clearConversation: () => set({ activeConversationId: null }),
    }),
    {
      name: 'coach-store',
      partialize: (state) => ({
        lastConversationId: state.lastConversationId,
      }),
    }
  )
);
