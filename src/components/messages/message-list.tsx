'use client';

import { useRef, useEffect, useCallback } from 'react';
import { MessageItem } from './message-item';
import { LoadingSpinner } from '@/components/shared/loading';
import { NoMessages } from '@/components/shared/empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '@/types/database';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

// Check if two messages are from different days
function isDifferentDay(ts1: number, ts2: number): boolean {
  const date1 = new Date(ts1);
  const date2 = new Date(ts2);
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
}

export function MessageList({
  messages,
  loading = false,
  hasMore = false,
  onLoadMore,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    // Only auto-scroll if new messages were added (not when loading more history)
    if (messages.length > prevMessagesLength.current) {
      const isNewMessage =
        messages.length > 0 &&
        prevMessagesLength.current > 0 &&
        messages[messages.length - 1].timestamp >
          messages[prevMessagesLength.current - 1]?.timestamp;

      if (isNewMessage) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      // Load more when scrolled near the top
      if (target.scrollTop < 100 && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  if (messages.length === 0 && !loading) {
    return <NoMessages />;
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex-1 p-4"
      onScrollCapture={handleScroll}
    >
      {/* Loading indicator at top for infinite scroll */}
      {loading && hasMore && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {/* Messages */}
      <div className="space-y-1">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showTimestamp =
            index === 0 ||
            (prevMessage && isDifferentDay(prevMessage.timestamp, message.timestamp));

          return (
            <MessageItem
              key={message.id}
              message={message}
              showTimestamp={showTimestamp}
            />
          );
        })}
      </div>

      {/* Loading indicator for initial load */}
      {loading && messages.length === 0 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </ScrollArea>
  );
}

export default MessageList;
