'use client';

import { Send, Loader2 } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';

const QUICK_ACTIONS = [
  'What should I do today?',
  'Build a sled push workout',
  'Analyze my station weaknesses',
  'Am I ready for race day?',
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
  showQuickActions?: boolean;
}

export function ChatInput({
  onSend,
  disabled,
  loading,
  showQuickActions,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || disabled || loading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="space-y-3">
      {/* Quick action chips */}
      {showQuickActions && (
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => onSend(action)}
              disabled={disabled || loading}
              className="px-3 py-1.5 rounded-full bg-surface-2 border border-border-default text-text-secondary font-body text-xs hover:border-hyrox-yellow hover:text-hyrox-yellow transition-colors disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 bg-surface-1 border border-border-default rounded-lg p-2 focus-within:border-hyrox-yellow transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Coach K..."
          disabled={disabled || loading}
          rows={1}
          className="flex-1 bg-transparent resize-none font-body text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none min-h-[36px] max-h-[160px] py-1.5 px-2"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled || loading}
          className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-md bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover disabled:opacity-30 disabled:hover:bg-hyrox-yellow transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
