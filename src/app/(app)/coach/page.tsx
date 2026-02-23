'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Zap, Mic, MicOff, Menu } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  useConversations,
  useMessages,
  useInvalidateConversations,
} from '@/hooks/use-conversations';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { TypingIndicator } from '@/components/shared';
import { ChatSidebar } from '@/components/coach/chat-sidebar';
import { PlanCard, isPlanMessage } from '@/components/coach/plan-card';

// ── Quick prompt chips ──
const QUICK_PROMPTS = [
  {
    label: 'Race prediction',
    msg: 'What finish time can I realistically target based on my current sims?',
  },
  {
    label: 'Plan my week',
    msg: 'Can you plan my training for this week based on my current phase?',
  },
  {
    label: 'Analyze my form',
    msg: 'Can you analyze my recent workout data and give me form tips?',
  },
  {
    label: 'Recovery check',
    msg: 'Based on my recent training load, should I take a recovery day?',
  },
];

// ── Entrance animation variants ──
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export default function CoachPage() {
  // ── Local input state ──
  const [textInput, setTextInput] = useState('');

  // ── Conversation state ──
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const coldStartTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [coldStart, setColdStart] = useState(false);

  // ── Data hooks ──
  const { data: conversations = [], isLoading: convsLoading } =
    useConversations();
  const { data: dbMessages } = useMessages(activeConversationId);
  const { invalidateConversations, invalidateMessages } =
    useInvalidateConversations();

  // ── Web Speech API ──
  const autoSendTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    isListening,
    isSupported: voiceSupported,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (finalTranscript) => {
      setTextInput((prev) => {
        const combined = prev ? `${prev} ${finalTranscript}` : finalTranscript;
        return combined;
      });
    },
    onInterim: () => {
      // Clear any pending auto-send timer while user is still speaking
      clearTimeout(autoSendTimerRef.current);
    },
  });

  // ── Ref to hold callbacks that need latest state ──
  const callbacksRef = useRef({
    onResponseHeader: (convId: string) => {
      setActiveConversationId(convId);
      invalidateConversations();
    },
    activeConversationId,
  });
  callbacksRef.current.activeConversationId = activeConversationId;
  callbacksRef.current.onResponseHeader = (convId: string) => {
    setActiveConversationId(convId);
    invalidateConversations();
  };

  // ── Transport for streaming ──
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          conversationId: callbacksRef.current.activeConversationId,
        }),
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

  // ── useChat hook (real SSE streaming) ──
  const { messages, status, sendMessage, setMessages } = useChat({
    transport,
    onFinish: () => {
      clearTimeout(coldStartTimer.current);
      setColdStart(false);
      setErrorMsg(null);
      const convId = callbacksRef.current.activeConversationId;
      if (convId) invalidateMessages(convId);
      invalidateConversations();
    },
    onError: (error) => {
      clearTimeout(coldStartTimer.current);
      setColdStart(false);
      setErrorMsg(error.message || 'Coach K encountered an error');
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // ── Scroll to bottom on new messages ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Sync DB messages when conversation changes ──
  useEffect(() => {
    if (isStreaming) return;
    if (!dbMessages) return;

    setMessages(
      dbMessages.map((m) => {
        const parts: { type: 'text'; text: string }[] = [];

        if (m.suggested_actions && typeof m.suggested_actions === 'object') {
          const sa = m.suggested_actions as {
            tools_used?: Array<{ tool: string }>;
          };
          if (Array.isArray(sa.tools_used) && sa.tools_used.length > 0) {
            const toolNames = sa.tools_used.map((t) => t.tool).join(', ');
            parts.push({
              type: 'text' as const,
              text: `[Used tools: ${toolNames}]\n\n`,
            });
          }
        }

        parts.push({ type: 'text' as const, text: m.content });

        return {
          id: m.id,
          role: m.role as 'user' | 'assistant',
          parts,
        };
      })
    );
  }, [dbMessages, isStreaming, setMessages]);

  // ── Cold start detection ──
  useEffect(() => {
    if (status === 'submitted') {
      coldStartTimer.current = setTimeout(() => setColdStart(true), 5000);
    }
    return () => clearTimeout(coldStartTimer.current);
  }, [status]);

  // ── Auto-select most recent conversation on mount ──
  useEffect(() => {
    if (convsLoading || activeConversationId) return;
    if (conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [convsLoading, conversations, activeConversationId]);

  // ── Dismiss error after 5 seconds ──
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  // ── Handlers ──
  function handleSend() {
    const text = textInput.trim();
    if (!text || isStreaming) return;
    setTextInput('');
    sendMessage({ text });
  }

  function handleQuickPrompt(msg: string) {
    if (isStreaming) return;
    sendMessage({ text: msg });
  }

  function handleMicToggle() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    setSidebarOpen(false);
  }

  // ── Extract text content from a message ──
  function getMessageText(msg: (typeof messages)[number]): string {
    if (!msg.parts) return '';
    return msg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }

  const hasMessages = messages.length > 0;
  // Show interim transcript in the input display
  const displayValue = isListening && interimTranscript
    ? `${textInput}${textInput ? ' ' : ''}${interimTranscript}`
    : textInput;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28 }}
        className="flex-1 flex flex-col px-6 pt-6 pb-24 relative z-10 overflow-hidden bg-bg-deep min-h-screen"
      >
        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Chat history"
            >
              <Menu size={16} />
            </motion.button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">
                Hyrox AI Coach
              </h2>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                {coldStart
                  ? 'Warming up...'
                  : isStreaming
                    ? 'Coach is thinking...'
                    : 'Ask anything about your training'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Quick prompt chips ── */}
        <div
          className="flex gap-2 mb-4 flex-shrink-0 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {QUICK_PROMPTS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleQuickPrompt(chip.msg)}
              disabled={isStreaming}
              className="flex-shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60 hover:text-white hover:border-[#39FF14]/40 transition-colors uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <p className="text-xs text-red-400">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages ── */}
        <div
          className="flex-1 overflow-y-auto space-y-5 pb-4 pr-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Empty state */}
          {!hasMessages && !isStreaming && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center justify-center h-full text-center gap-4 py-20"
            >
              <div className="w-16 h-16 rounded-full bg-[#39FF14]/10 flex items-center justify-center border border-[#39FF14]/20">
                <Zap size={28} className="text-[#39FF14]" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-1">
                  Coach K
                </h3>
                <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                  Your AI Hyrox coach. Ask about training, technique, race
                  strategy, or anything Hyrox.
                </p>
              </div>
            </motion.div>
          )}

          {/* Message thread */}
          {messages.map((msg) => {
            const text = getMessageText(msg);
            if (!text) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-end"
                >
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-tr-none p-4 max-w-[85%] border border-white/5">
                    <p className="text-sm leading-relaxed">{text}</p>
                  </div>
                </motion.div>
              );
            }

            if (msg.role === 'assistant') {
              const hasPlan = isPlanMessage(text);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-start"
                >
                  <div className="bg-bg-card/80 backdrop-blur-xl rounded-2xl rounded-tl-none p-4 max-w-[90%] border border-[#39FF14]/20">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#39FF14] flex items-center justify-center">
                        <Zap size={9} className="text-black" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#39FF14]">
                        Hyrox Coach AI
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-white/85 prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:text-white prose-headings:font-bold prose-strong:text-white prose-li:text-white/85 prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  </div>
                  {/* Show plan card below plan messages */}
                  {hasPlan && (
                    <div className="max-w-[90%]">
                      <PlanCard
                        messageContent={text}
                        conversationId={activeConversationId}
                      />
                    </div>
                  )}
                </motion.div>
              );
            }

            return null;
          })}

          {/* AI Loading State */}
          <AnimatePresence>
            {isStreaming &&
              messages[messages.length - 1]?.role !== 'assistant' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col items-start"
                >
                  <div className="bg-bg-card/80 backdrop-blur-xl rounded-2xl rounded-tl-none px-3 py-2 border border-[#39FF14]/20">
                    <TypingIndicator />
                  </div>
                  <span className="text-[10px] text-white/20 mt-1.5 uppercase font-bold">
                    {coldStart
                      ? 'Coach AI is warming up...'
                      : 'Coach AI is thinking...'}
                  </span>
                </motion.div>
              )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area — unified text + mic ── */}
        <div className="flex-shrink-0 pt-3 border-t border-white/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2.5 border border-white/10 focus-within:border-[#39FF14]/40 transition-colors"
          >
            {/* Mic button — only shown if browser supports Web Speech API */}
            {voiceSupported && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={handleMicToggle}
                disabled={isStreaming}
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  isListening
                    ? 'bg-[#39FF14] shadow-[0_0_16px_rgba(57,255,20,0.4)]'
                    : 'bg-white/10 text-white/40 hover:text-white'
                } disabled:opacity-30`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                aria-pressed={isListening}
              >
                {isListening ? (
                  <MicOff size={14} className="text-black" />
                ) : (
                  <Mic size={14} />
                )}
              </motion.button>
            )}

            {/* Text input */}
            <input
              type="text"
              value={displayValue}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening...'
                  : 'Ask about your race prep, session plan, pacing...'
              }
              className={`flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none min-w-0 ${
                isListening && interimTranscript ? 'italic text-white/50' : ''
              }`}
              aria-label="Message input"
              readOnly={isListening}
              disabled={isStreaming}
            />

            {/* Send button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.9 }}
              disabled={!textInput.trim() || isStreaming}
              className="w-8 h-8 rounded-xl bg-[#39FF14] flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
              aria-label="Send message"
            >
              <Send size={14} className="text-black" />
            </motion.button>
          </form>

          {/* Voice listening indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-2 pt-2"
              >
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-[#39FF14] rounded-full"
                      animate={{
                        height: [4, 12, 4],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#39FF14]/60 uppercase font-bold tracking-widest">
                  Listening — tap mic to stop
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Chat History Sidebar ── */}
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
      />
    </>
  );
}
