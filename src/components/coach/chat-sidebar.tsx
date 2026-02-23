'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, MessageCircle } from 'lucide-react';
import { useEffect } from 'react';

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string | null;
}

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ChatSidebar({
  open,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: ChatSidebarProps) {
  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0f0f0f] border-r border-white/10 z-[71] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-safe pb-3 border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/80">
                Chats
              </h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                aria-label="Close sidebar"
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* New Chat button */}
            <div className="px-3 py-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onNewChat}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-xs font-bold uppercase tracking-widest hover:bg-[#39FF14]/15 transition-colors"
              >
                <Plus size={14} />
                New Chat
              </motion.button>
            </div>

            {/* Conversation list */}
            <div
              className="flex-1 overflow-y-auto px-3 pb-safe"
              style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
            >
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={24} className="text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/20">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    return (
                      <motion.button
                        key={conv.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-[#39FF14]/10 border border-[#39FF14]/20'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <p
                          className={`text-sm truncate ${
                            isActive ? 'text-white font-semibold' : 'text-white/60'
                          }`}
                        >
                          {conv.title || 'Untitled chat'}
                        </p>
                        <p className="text-[10px] text-white/20 mt-0.5">
                          {formatDate(conv.updated_at)}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
