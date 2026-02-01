'use client';

import { memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading';
import { NoMessages, NoSearchResults } from '@/components/shared/empty-state';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/stores/message-store';

interface ChatListProps {
  conversations: Conversation[];
  loading?: boolean;
  activeJid?: string | null;
  onSelect?: (jid: string) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

// Get initials from name or phone
function getInitials(name: string | null, phone: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (phone) {
    return phone.slice(-2);
  }
  return '??';
}

// Format timestamp for display
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

// Truncate message content
function truncateMessage(content: string | null, maxLength: number = 50): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

const ChatItem = memo(function ChatItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const { name, phone, lastMessage, unreadCount } = conversation;
  const displayName = name || phone || conversation.jid?.split('@')[0] || 'Unknown';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
        isActive && 'bg-brand-primary/10 hover:bg-brand-primary/10'
      )}
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarFallback className="bg-brand-primary text-white">
          {getInitials(name, phone)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{displayName}</span>
          {lastMessage && (
            <span className="text-xs text-neutral-500 shrink-0">
              {formatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-neutral-500 truncate">
            {lastMessage?.from_me && <span className="text-neutral-400">You: </span>}
            {truncateMessage(lastMessage?.content ?? null) || 'No messages'}
          </p>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="bg-brand-primary text-white text-xs px-2 py-0.5 shrink-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
});

export function ChatList({
  conversations,
  loading = false,
  activeJid,
  onSelect,
  searchQuery = '',
  onSearch,
}: ChatListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSelect = (jid: string) => {
    if (onSelect) {
      onSelect(jid);
    }
    // Navigate to conversation
    router.push(`/messages/${encodeURIComponent(jid)}`);
  };

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter((c) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          c.name?.toLowerCase().includes(searchLower) ||
          c.phone?.toLowerCase().includes(searchLower) ||
          c.jid.toLowerCase().includes(searchLower)
        );
      })
    : conversations;

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
      {onSearch && (
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredConversations.length === 0 ? (
          searchQuery ? (
            <NoSearchResults query={searchQuery} />
          ) : (
            <NoMessages />
          )
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <ChatItem
                key={conversation.jid}
                conversation={conversation}
                isActive={
                  activeJid === conversation.jid ||
                  pathname === `/messages/${encodeURIComponent(conversation.jid)}`
                }
                onClick={() => handleSelect(conversation.jid)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default ChatList;
