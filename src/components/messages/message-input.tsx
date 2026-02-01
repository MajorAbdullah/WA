'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (text: string) => Promise<boolean>;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  sending = false,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleSend = useCallback(async () => {
    const trimmedText = text.trim();
    if (!trimmedText || sending || disabled) return;

    const success = await onSend(trimmedText);
    if (success) {
      setText('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [text, sending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const isDisabled = disabled || sending;
  const canSend = text.trim().length > 0 && !isDisabled;

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border border-neutral-200 dark:border-neutral-800',
              'bg-neutral-50 dark:bg-neutral-900',
              'px-4 py-3 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
              'placeholder:text-neutral-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[44px] max-h-[150px]'
            )}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className={cn(
            'h-11 w-11 rounded-lg shrink-0',
            'bg-brand-primary hover:bg-brand-primary-dark',
            'disabled:bg-neutral-200 disabled:dark:bg-neutral-800'
          )}
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Character count / hint */}
      <p className="text-xs text-neutral-400 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

export default MessageInput;
