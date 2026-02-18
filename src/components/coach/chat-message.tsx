'use client';

import { ThumbsUp, ThumbsDown, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemo, useState } from 'react';
import { ToolResultRenderer } from './tool-result-renderer';
import { TrainingPlanCard } from './training-plan-card';
import { isToolUIPart, getToolName, type UIMessage } from 'ai';

/** Detect if the message text contains a structured training plan (4+ "Week N" mentions + day/workout keywords). */
function containsTrainingPlan(text: string): boolean {
  const weekMatches = text.match(/week\s*\d+/gi) || [];
  const hasDayKeyword = /day\s*\d+|monday|tuesday|wednesday|thursday|friday|saturday|sunday|session_type|workout/i.test(text);
  return weekMatches.length >= 4 && hasDayKeyword;
}

interface ChatMessageProps {
  message: UIMessage;
  conversationId?: string | null;
  onFeedback?: (
    messageId: string,
    feedback: 'positive' | 'negative' | null
  ) => void;
}

export function ChatMessage({ message, conversationId, onFeedback }: ChatMessageProps) {
  const [currentFeedback, setCurrentFeedback] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const isToolRunning = message.parts?.some(
    (p) => isToolUIPart(p) && p.state !== 'output-available'
  );

  // Gather all text content for plan detection
  const fullText = useMemo(
    () =>
      message.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => (p as { type: 'text'; text: string }).text)
        .join('') ?? '',
    [message.parts]
  );
  const hasPlan = !isUser && !isToolRunning && containsTrainingPlan(fullText);

  async function handleFeedback(type: 'positive' | 'negative') {
    if (!message.id || !onFeedback) return;
    const newFeedback = currentFeedback === type ? null : type;
    setCurrentFeedback(newFeedback);
    onFeedback(message.id, newFeedback as 'positive' | 'negative' | null);
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%] bg-hyrox-yellow/10 border border-hyrox-yellow/20 rounded-lg px-4 py-3">
          <p className="font-body text-sm text-text-primary whitespace-pre-wrap">
            {fullText}
          </p>
        </div>
      </div>
    );
  }

  const hasTextContent = message.parts?.some(
    (p) => p.type === 'text' && p.text.trim().length > 0
  );

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center border border-border-default">
        <Bot className="h-4 w-4 text-hyrox-yellow" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="max-w-[90%] md:max-w-[80%]">
          {message.parts?.map((part, i) => {
            if (part.type === 'text' && part.text.trim()) {
              return (
                <div
                  key={i}
                  className="prose prose-sm prose-invert max-w-none font-body text-text-primary [&_h1]:font-display [&_h1]:text-lg [&_h1]:uppercase [&_h1]:tracking-wider [&_h2]:font-display [&_h2]:text-base [&_h2]:uppercase [&_h2]:tracking-wider [&_h3]:font-display [&_h3]:text-sm [&_h3]:uppercase [&_h3]:tracking-wider [&_strong]:text-hyrox-yellow [&_li]:text-text-primary [&_p]:text-text-primary [&_a]:text-hyrox-yellow [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:rounded-sm [&_pre]:bg-surface-2 [&_pre]:border [&_pre]:border-border-default"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            }
            if (isToolUIPart(part)) {
              const toolName = getToolName(part);
              if (toolName === 'search_knowledge_base') {
                return null;
              }
              if (part.state === 'output-available') {
                return (
                  <ToolResultRenderer
                    key={i}
                    toolName={toolName}
                    result={part.output}
                  />
                );
              }
              return (
                <div key={i} className="flex items-center gap-2 py-2">
                  <div className="h-2 w-2 rounded-full bg-hyrox-yellow animate-pulse" />
                  <span className="font-body text-xs text-text-tertiary">
                    Working...
                  </span>
                </div>
              );
            }
            return null;
          })}

          {!hasTextContent && isToolRunning && (
            <div className="flex items-center gap-2 py-2">
              <div className="h-2 w-2 rounded-full bg-hyrox-yellow animate-pulse" />
              <span className="font-body text-xs text-text-tertiary">
                Thinking...
              </span>
            </div>
          )}

          {/* Training plan detected — show Review & Accept card */}
          {hasPlan && (
            <TrainingPlanCard
              messageContent={fullText}
              conversationId={conversationId ?? undefined}
            />
          )}
        </div>

        {/* Feedback buttons */}
        {message.id && !isToolRunning && hasTextContent && (
          <div className="flex gap-1">
            <button
              onClick={() => handleFeedback('positive')}
              className={`p-1 rounded transition-colors ${
                currentFeedback === 'positive'
                  ? 'text-semantic-success'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('negative')}
              className={`p-1 rounded transition-colors ${
                currentFeedback === 'negative'
                  ? 'text-semantic-error'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
