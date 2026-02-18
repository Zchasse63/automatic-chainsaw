'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
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

export default function CoachPage() {
  const searchParams = useSearchParams();
  const { activeConversationId, lastConversationId, setActiveConversation } =
    useCoachStore();

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const coldStartTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasInitialized = useRef(false);

  // Ref to hold callbacks that need access to latest state
  const callbacksRef = useRef({
    onResponseHeader: (convId: string) => {
      setActiveConversation(convId);
      invalidateConversations();
    },
    activeConversationId,
  });
  callbacksRef.current.activeConversationId = activeConversationId;
  callbacksRef.current.onResponseHeader = (convId: string) => {
    setActiveConversation(convId);
    invalidateConversations();
  };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ conversationId: callbacksRef.current.activeConversationId }),
        fetch: async (input, init) => {
          const response = await globalThis.fetch(input, init);
          const convId = response.headers.get('X-Conversation-Id');
          if (convId && !callbacksRef.current.activeConversationId) {
            callbacksRef.current.onResponseHeader(convId);
          }
          clearTimeout(coldStartTimer.current);
          setColdStart(false);
          return response;
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, status, sendMessage, setMessages } = useChat({
    transport,
    onFinish: () => {
      clearTimeout(coldStartTimer.current);
      setColdStart(false);
      const convId = callbacksRef.current.activeConversationId;
      if (convId) invalidateMessages(convId);
      invalidateConversations();
    },
    onError: () => {
      clearTimeout(coldStartTimer.current);
      setColdStart(false);
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

  // Sync DB messages when switching conversations
  useEffect(() => {
    if (isStreaming) return;
    if (!dbMessages) return;

    setMessages(
      dbMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.content }],
      }))
    );
  }, [dbMessages, isStreaming, setMessages]);

  // Cold start detection
  useEffect(() => {
    if (status === 'submitted') {
      coldStartTimer.current = setTimeout(() => setColdStart(true), 5000);
    }
    return () => clearTimeout(coldStartTimer.current);
  }, [status]);

  function handleSelectConversation(convId: string) {
    setActiveConversation(convId);
    setMessages([]);
    setSidebarOpen(false);
  }

  function handleNewConversation() {
    setActiveConversation(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  function handleSend(message: string) {
    sendMessage({ text: message });
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

  const hasMessages = messages.length > 0;

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
            {isStreaming && (
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

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onFeedback={handleFeedback}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border-default bg-surface-0 p-4">
          <ChatInput
            onSend={handleSend}
            disabled={isStreaming}
            loading={isStreaming}
            showQuickActions={!hasMessages}
            initialValue={!hasMessages ? initialPrompt : undefined}
          />
        </div>
      </div>
    </div>
  );
}
