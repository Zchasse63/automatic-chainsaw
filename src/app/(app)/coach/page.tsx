'use client';

import { ChatMessage } from '@/components/coach/chat-message';
import { ChatInput } from '@/components/coach/chat-input';
import { ConversationSidebar } from '@/components/coach/conversation-sidebar';
import { Bot, Menu, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useConversations,
  useMessages,
  useInvalidateConversations,
} from '@/hooks/use-conversations';
import { useCoachStore } from '@/stores/coach-store';

interface LocalMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: string | null;
  isStreaming?: boolean;
  suggested_actions?: Record<string, unknown> | null;
}

export default function CoachPage() {
  const searchParams = useSearchParams();
  const { activeConversationId, lastConversationId, setActiveConversation } =
    useCoachStore();

  // Build initial prompt from context search params
  const initialPrompt = useMemo(() => {
    const context = searchParams.get('context');
    if (!context) return undefined;
    if (context === 'plan') {
      const planName = searchParams.get('planName');
      return planName
        ? `I have a question about my training plan "${planName}". `
        : 'I have a question about my current training plan. ';
    }
    return undefined;
  }, [searchParams]);
  const { data: conversations = [], isLoading: convsLoading } =
    useConversations();
  const { data: dbMessages } = useMessages(activeConversationId);
  const { invalidateConversations, invalidateMessages } =
    useInvalidateConversations();

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const coldStartTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, scrollToBottom]);

  // Auto-select last conversation on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    if (convsLoading) return;
    hasInitialized.current = true;

    if (
      lastConversationId &&
      !activeConversationId &&
      conversations.some((c) => c.id === lastConversationId)
    ) {
      setActiveConversation(lastConversationId);
    }
  }, [
    convsLoading,
    conversations,
    lastConversationId,
    activeConversationId,
    setActiveConversation,
  ]);

  // Sync DB messages to local state (when not streaming)
  useEffect(() => {
    if (streaming) return;
    if (!dbMessages) return;

    setLocalMessages(
      dbMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        feedback: m.feedback,
        suggested_actions: m.suggested_actions,
      }))
    );
  }, [dbMessages, streaming]);

  function handleSelectConversation(convId: string) {
    setActiveConversation(convId);
    setLocalMessages([]);
    setError(null);
    setSidebarOpen(false);
  }

  function handleNewConversation() {
    setActiveConversation(null);
    setLocalMessages([]);
    setError(null);
    setSidebarOpen(false);
  }

  async function handleSend(message: string) {
    setError(null);
    setStreaming(true);
    setColdStart(false);

    // Add user message immediately
    setLocalMessages((prev) => [...prev, { role: 'user', content: message }]);

    // Add placeholder assistant message for streaming
    setLocalMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', isStreaming: true },
    ]);

    // Start cold start timer (show "warming up" after 5s)
    coldStartTimer.current = setTimeout(() => {
      setColdStart(true);
    }, 5000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: activeConversationId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      // Get conversation ID from header if new conversation
      const convId = res.headers.get('X-Conversation-Id');
      if (convId && !activeConversationId) {
        setActiveConversation(convId);
        invalidateConversations();
      }

      clearTimeout(coldStartTimer.current);
      setColdStart(false);

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);

              if (parsed.token) {
                setLocalMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + parsed.token,
                    };
                  }
                  return updated;
                });
              }

              // Capture metadata event with message ID
              if (parsed.done && parsed.messageId) {
                setLocalMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.isStreaming) {
                    updated[updated.length - 1] = {
                      ...last,
                      id: parsed.messageId,
                    };
                  }
                  return updated;
                });
              }

              if (parsed.error) {
                setError(parsed.error);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Mark streaming complete
      setLocalMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.isStreaming) {
          updated[updated.length - 1] = { ...last, isStreaming: false };
        }
        return updated;
      });

      // Refresh messages from DB to get full metadata (suggested_actions, etc.)
      const currentConvId = convId || activeConversationId;
      if (currentConvId) {
        invalidateMessages(currentConvId);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setLocalMessages((prev) =>
        prev.filter((m) => !m.isStreaming || m.content)
      );
    } finally {
      clearTimeout(coldStartTimer.current);
      setColdStart(false);
      setStreaming(false);
    }
  }

  async function handleFeedback(
    messageId: string,
    feedback: 'positive' | 'negative' | null
  ) {
    await fetch(`/api/messages/${messageId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
  }

  const hasMessages = localMessages.length > 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-72 flex-col bg-surface-1 border-r border-border-default">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface-1 shadow-lg">
            <div className="flex items-center justify-between p-3 border-b border-border-default">
              <span className="font-display text-sm uppercase tracking-wider text-text-primary">
                Conversations
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-text-tertiary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ConversationSidebar
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
            />
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default bg-surface-1">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-text-secondary hover:text-text-primary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Bot className="h-5 w-5 text-hyrox-yellow" />
          <div>
            <h1 className="font-display text-sm font-bold uppercase tracking-wider text-text-primary">
              Coach K
            </h1>
            {streaming && (
              <p className="font-body text-[10px] text-hyrox-yellow">
                {coldStart ? 'Warming up...' : 'Thinking...'}
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center border border-border-default">
                <Bot className="h-8 w-8 text-hyrox-yellow" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
                  Coach K
                </h2>
                <p className="font-body text-sm text-text-secondary max-w-sm">
                  Your AI Hyrox coach. Ask about training, technique, race
                  strategy, or anything Hyrox.
                </p>
              </div>
            </div>
          )}

          {localMessages.map((msg, i) => (
            <ChatMessage
              key={msg.id || `msg-${i}`}
              id={msg.id}
              role={msg.role}
              content={msg.content}
              feedback={msg.feedback}
              isStreaming={msg.isStreaming}
              suggestedActions={msg.suggested_actions}
              onFeedback={handleFeedback}
            />
          ))}

          {error && (
            <div className="bg-semantic-error/10 border border-semantic-error/20 rounded-sm px-4 py-3">
              <p className="font-body text-sm text-semantic-error">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border-default bg-surface-0 p-4">
          <ChatInput
            onSend={handleSend}
            disabled={streaming}
            loading={streaming}
            showQuickActions={!hasMessages}
            initialValue={!hasMessages ? initialPrompt : undefined}
          />
        </div>
      </div>
    </div>
  );
}
