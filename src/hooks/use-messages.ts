'use client';

import { useCallback, useEffect } from 'react';
import { useMessageStore, type Conversation } from '@/stores/message-store';
import { useSocket } from '@/hooks/use-socket';
import type { Message } from '@/types/database';

interface UseMessagesOptions {
  autoFetch?: boolean;
}

interface UseMessagesReturn {
  // Conversations
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;
  fetchConversations: () => Promise<void>;

  // Active conversation
  activeJid: string | null;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  hasMore: boolean;
  selectConversation: (jid: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;

  // Send message
  sendingMessage: boolean;
  sendError: string | null;
  sendMessage: (text: string, jid?: string) => Promise<boolean>;

  // Search
  searchQuery: string;
  searchResults: Message[];
  searching: boolean;
  searchMessages: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { autoFetch = true } = options;
  const { socket, isConnected } = useSocket();

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    setConversations,
    setConversationsLoading,
    setConversationsError,

    activeJid,
    messages,
    messagesLoading,
    messagesError,
    hasMore,
    page,
    setActiveJid,
    setMessages,
    appendMessages,
    setMessagesLoading,
    setMessagesError,
    setHasMore,
    setPage,

    sendingMessage,
    sendError,
    setSendingMessage,
    setSendError,

    searchQuery,
    searchResults,
    searching,
    setSearchQuery,
    setSearchResults,
    setSearching,

    addIncomingMessage,
    addOutgoingMessage,
    updateMessageStatus,
  } = useMessageStore();

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError(null);

    try {
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      setConversationsError(
        error instanceof Error ? error.message : 'Failed to fetch conversations'
      );
    } finally {
      setConversationsLoading(false);
    }
  }, [setConversations, setConversationsLoading, setConversationsError]);

  // Select a conversation and load its messages
  const selectConversation = useCallback(
    async (jid: string) => {
      setActiveJid(jid);
      setMessagesLoading(true);
      setMessagesError(null);

      try {
        const response = await fetch(`/api/messages/${encodeURIComponent(jid)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data.messages);
        setHasMore(data.hasMore ?? data.messages.length >= 50);
        setPage(1);

        // Join the chat room for real-time updates
        if (socket && isConnected) {
          socket.emit('chat:join', jid);
        }
      } catch (error) {
        setMessagesError(
          error instanceof Error ? error.message : 'Failed to fetch messages'
        );
      } finally {
        setMessagesLoading(false);
      }
    },
    [
      setActiveJid,
      setMessages,
      setMessagesLoading,
      setMessagesError,
      setHasMore,
      setPage,
      socket,
      isConnected,
    ]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!activeJid || messagesLoading || !hasMore) return;

    setMessagesLoading(true);
    const nextPage = page + 1;

    try {
      const response = await fetch(
        `/api/messages/${encodeURIComponent(activeJid)}?page=${nextPage}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch more messages');
      }

      const data = await response.json();
      appendMessages(data.messages);
      setHasMore(data.hasMore ?? data.messages.length >= 50);
      setPage(nextPage);
    } catch (error) {
      setMessagesError(
        error instanceof Error ? error.message : 'Failed to fetch more messages'
      );
    } finally {
      setMessagesLoading(false);
    }
  }, [
    activeJid,
    messagesLoading,
    hasMore,
    page,
    appendMessages,
    setMessagesLoading,
    setMessagesError,
    setHasMore,
    setPage,
  ]);

  // Send a message
  const sendMessage = useCallback(
    async (text: string, jid?: string): Promise<boolean> => {
      const targetJid = jid || activeJid;
      if (!targetJid || !text.trim()) return false;

      setSendingMessage(true);
      setSendError(null);

      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jid: targetJid, text: text.trim() }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send message');
        }

        return true;
      } catch (error) {
        setSendError(
          error instanceof Error ? error.message : 'Failed to send message'
        );
        return false;
      } finally {
        setSendingMessage(false);
      }
    },
    [activeJid, setSendingMessage, setSendError]
  );

  // Search messages
  const searchMessages = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);

      try {
        const response = await fetch(
          `/api/messages/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          throw new Error('Failed to search messages');
        }

        const data = await response.json();
        setSearchResults(data.messages);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [setSearchQuery, setSearchResults, setSearching]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, [setSearchQuery, setSearchResults]);

  // Auto-fetch conversations on mount
  useEffect(() => {
    if (autoFetch && conversations.length === 0) {
      fetchConversations();
    }
  }, [autoFetch, conversations.length, fetchConversations]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingMessage = (message: Message) => {
      addIncomingMessage(message);
    };

    const handleOutgoingMessage = (message: Message) => {
      addOutgoingMessage(message);
    };

    const handleMessageStatus = (update: { messageId: string; status: string }) => {
      updateMessageStatus(update.messageId, update.status);
    };

    socket.on('message:incoming', handleIncomingMessage);
    socket.on('message:outgoing', handleOutgoingMessage);
    socket.on('message:status', handleMessageStatus);

    return () => {
      socket.off('message:incoming', handleIncomingMessage);
      socket.off('message:outgoing', handleOutgoingMessage);
      socket.off('message:status', handleMessageStatus);
    };
  }, [socket, isConnected, addIncomingMessage, addOutgoingMessage, updateMessageStatus]);

  // Leave chat room when changing conversations
  useEffect(() => {
    return () => {
      if (socket && isConnected && activeJid) {
        socket.emit('chat:leave', activeJid);
      }
    };
  }, [socket, isConnected, activeJid]);

  return {
    conversations,
    conversationsLoading,
    conversationsError,
    fetchConversations,

    activeJid,
    messages,
    messagesLoading,
    messagesError,
    hasMore,
    selectConversation,
    loadMoreMessages,

    sendingMessage,
    sendError,
    sendMessage,

    searchQuery,
    searchResults,
    searching,
    searchMessages,
    clearSearch,
  };
}
