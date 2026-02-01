'use client';

import { memo } from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/database';

interface MessageItemProps {
  message: Message;
  showTimestamp?: boolean;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
}

function StatusIcon({ status }: { status: string | null }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3 text-neutral-400" />;
    case 'sent':
      return <Check className="h-3 w-3 text-neutral-400" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-neutral-400" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-brand-accent" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-color-error" />;
    default:
      return null;
  }
}

export const MessageItem = memo(function MessageItem({
  message,
  showTimestamp = false,
}: MessageItemProps) {
  const isOutgoing = message.from_me;

  return (
    <div className="flex flex-col">
      {showTimestamp && (
        <div className="flex justify-center my-4">
          <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
            {formatDate(message.timestamp)}
          </span>
        </div>
      )}

      <div
        className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}
      >
        <div
          className={cn(
            'message-bubble',
            isOutgoing ? 'message-bubble-outgoing' : 'message-bubble-incoming'
          )}
        >
          {/* Message content */}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content || (message.type !== 'text' ? `[${message.type}]` : '')}
          </p>

          {/* Media indicator */}
          {message.media_url && (
            <div className="mt-1 text-xs opacity-70">
              [Media attachment]
            </div>
          )}

          {/* Timestamp and status */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isOutgoing ? 'justify-end' : 'justify-start'
            )}
          >
            <span
              className={cn(
                'text-[10px]',
                isOutgoing ? 'text-white/70' : 'text-neutral-500'
              )}
            >
              {formatTime(message.timestamp)}
            </span>
            {isOutgoing && <StatusIcon status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MessageItem;
