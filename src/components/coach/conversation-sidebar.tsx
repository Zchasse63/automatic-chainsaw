'use client';

import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string | null;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
}: ConversationSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <div className="p-3 border-b border-border-default">
        <Button
          onClick={onNew}
          className="w-full bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider text-xs"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
            <p className="font-body text-xs text-text-tertiary">
              No conversations yet
            </p>
          </div>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  activeId === conv.id
                    ? 'bg-hyrox-yellow/10 border-l-2 border-hyrox-yellow'
                    : 'hover:bg-surface-2 border-l-2 border-transparent'
                }`}
              >
                <p
                  className={`font-body text-sm truncate ${
                    activeId === conv.id
                      ? 'text-text-primary'
                      : 'text-text-secondary'
                  }`}
                >
                  {conv.title || 'New Conversation'}
                </p>
                <p className="font-mono text-[10px] text-text-tertiary mt-0.5">
                  {formatTime(conv.updated_at)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
