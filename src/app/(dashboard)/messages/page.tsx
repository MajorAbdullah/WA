'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ChatList } from '@/components/messages/chat-list';
import { NoMessages } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/use-messages';

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    conversations,
    conversationsLoading,
    activeJid,
    selectConversation,
  } = useMessages();

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      {/* Chat list sidebar */}
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-950">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Messages</h1>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
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

      {/* Main content area - show empty state when no conversation selected */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <NoMessages />
      </div>
    </div>
  );
}
