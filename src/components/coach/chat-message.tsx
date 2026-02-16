'use client';

import { ThumbsUp, ThumbsDown, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

interface ChatMessageProps {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: string | null;
  isStreaming?: boolean;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative' | null) => void;
}

export function ChatMessage({
  id,
  role,
  content,
  feedback,
  isStreaming,
  onFeedback,
}: ChatMessageProps) {
  const [currentFeedback, setCurrentFeedback] = useState(feedback);
  const isUser = role === 'user';

  async function handleFeedback(type: 'positive' | 'negative') {
    if (!id || !onFeedback) return;
    const newFeedback = currentFeedback === type ? null : type;
    setCurrentFeedback(newFeedback);
    onFeedback(id, newFeedback);
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%] bg-hyrox-yellow/10 border border-hyrox-yellow/20 rounded-lg px-4 py-3">
          <p className="font-body text-sm text-text-primary whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center border border-border-default">
        <Bot className="h-4 w-4 text-hyrox-yellow" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="max-w-[90%] md:max-w-[80%]">
          <div className="prose prose-sm prose-invert max-w-none font-body text-text-primary [&_h1]:font-display [&_h1]:text-lg [&_h1]:uppercase [&_h1]:tracking-wider [&_h2]:font-display [&_h2]:text-base [&_h2]:uppercase [&_h2]:tracking-wider [&_h3]:font-display [&_h3]:text-sm [&_h3]:uppercase [&_h3]:tracking-wider [&_strong]:text-hyrox-yellow [&_li]:text-text-primary [&_p]:text-text-primary [&_a]:text-hyrox-yellow [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:rounded-sm [&_pre]:bg-surface-2 [&_pre]:border [&_pre]:border-border-default">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-hyrox-yellow animate-pulse ml-0.5" />
            )}
          </div>
        </div>

        {/* Feedback buttons — only show for completed assistant messages */}
        {id && !isStreaming && (
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
