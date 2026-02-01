'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MoreVertical, User } from 'lucide-react';
import { ChatList } from '@/components/messages/chat-list';
import { MessageList } from '@/components/messages/message-list';
import { MessageInput } from '@/components/messages/message-input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMessages } from '@/hooks/use-messages';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConversationPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [contact, setContact] = useState<{
    jid: string;
    name: string | null;
    phone: string | null;
  } | null>(null);

  const {
    conversations,
    conversationsLoading,
    activeJid,
    messages,
    messagesLoading,
    hasMore,
    selectConversation,
    loadMoreMessages,
    sendMessage,
    sendingMessage,
  } = useMessages();

  // Decode and select conversation when ID changes
  useEffect(() => {
    const jid = decodeURIComponent(id);
    if (jid && jid !== activeJid) {
      selectConversation(jid);
    }
  }, [id, activeJid, selectConversation]);

  // Fetch contact info
  useEffect(() => {
    async function fetchContact() {
      const jid = decodeURIComponent(id);
      try {
        const response = await fetch(`/api/messages/${encodeURIComponent(jid)}`);
        if (response.ok) {
          const data = await response.json();
          setContact(data.contact);
        }
      } catch (error) {
        console.error('Error fetching contact:', error);
      }
    }
    fetchContact();
  }, [id]);

  const displayName = contact?.name || contact?.phone || decodeURIComponent(id).split('@')[0];
  const initials = contact?.name
    ? contact.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (contact?.phone?.slice(-2) || '??');

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      {/* Chat list sidebar - hidden on mobile */}
      <div className="hidden lg:flex w-80 border-r border-neutral-200 dark:border-neutral-800 flex-col bg-white dark:bg-neutral-950">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="text-lg font-semibold">Messages</h1>
        </div>
        <ChatList
          conversations={conversations}
          loading={conversationsLoading}
          activeJid={activeJid}
          onSelect={selectConversation}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
      </div>

      {/* Conversation area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950">
        {/* Conversation header */}
        <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 gap-3">
          {/* Back button (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => router.push('/messages')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Contact avatar */}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-brand-primary text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Contact info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-sm truncate">{displayName}</h2>
            <p className="text-xs text-neutral-500 truncate">
              {contact?.phone || decodeURIComponent(id).split('@')[0]}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/users/${encodeURIComponent(decodeURIComponent(id))}`)}
            >
              <User className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/users/${encodeURIComponent(decodeURIComponent(id))}`)}
                >
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Clear chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages area */}
        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden',
            'bg-neutral-50 dark:bg-neutral-900'
          )}
        >
          <MessageList
            messages={messages}
            loading={messagesLoading}
            hasMore={hasMore}
            onLoadMore={loadMoreMessages}
          />
        </div>

        {/* Message input */}
        <MessageInput
          onSend={sendMessage}
          sending={sendingMessage}
          disabled={!activeJid}
        />
      </div>
    </div>
  );
}
