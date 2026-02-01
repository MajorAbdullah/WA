import { create } from 'zustand';
import type { Message } from '@/types/database';

// Conversation summary type
export interface Conversation {
  jid: string;
  name: string | null;
  phone: string | null;
  lastMessage: Message | null;
  unreadCount: number;
  messageCount: number;
}

// Message store state
interface MessageState {
  // Conversations list
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;

  // Active conversation
  activeJid: string | null;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  hasMore: boolean;
  page: number;

  // Sending state
  sendingMessage: boolean;
  sendError: string | null;

  // Search
  searchQuery: string;
  searchResults: Message[];
  searching: boolean;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setConversationsLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;

  setActiveJid: (jid: string | null) => void;
  setMessages: (messages: Message[]) => void;
  appendMessages: (messages: Message[]) => void;
  prependMessage: (message: Message) => void;
  setMessagesLoading: (loading: boolean) => void;
  setMessagesError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;

  setSendingMessage: (sending: boolean) => void;
  setSendError: (error: string | null) => void;

  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Message[]) => void;
  setSearching: (searching: boolean) => void;

  // Real-time updates
  addIncomingMessage: (message: Message) => void;
  addOutgoingMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: string) => void;

  // Reset
  reset: () => void;
  resetMessages: () => void;
}

const initialState = {
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,

  activeJid: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  hasMore: true,
  page: 1,

  sendingMessage: false,
  sendError: null,

  searchQuery: '',
  searchResults: [],
  searching: false,
};

export const useMessageStore = create<MessageState>((set, get) => ({
  ...initialState,

  // Conversations actions
  setConversations: (conversations) => set({ conversations }),
  setConversationsLoading: (conversationsLoading) => set({ conversationsLoading }),
  setConversationsError: (conversationsError) => set({ conversationsError }),

  // Active conversation actions
  setActiveJid: (activeJid) => set({ activeJid, messages: [], page: 1, hasMore: true }),
  setMessages: (messages) => set({ messages }),
  appendMessages: (newMessages) =>
    set((state) => ({ messages: [...state.messages, ...newMessages] })),
  prependMessage: (message) =>
    set((state) => ({ messages: [message, ...state.messages] })),
  setMessagesLoading: (messagesLoading) => set({ messagesLoading }),
  setMessagesError: (messagesError) => set({ messagesError }),
  setHasMore: (hasMore) => set({ hasMore }),
  setPage: (page) => set({ page }),

  // Sending actions
  setSendingMessage: (sendingMessage) => set({ sendingMessage }),
  setSendError: (sendError) => set({ sendError }),

  // Search actions
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearching: (searching) => set({ searching }),

  // Real-time message updates
  addIncomingMessage: (message) => {
    const state = get();

    // Update conversations list
    const existingConvIndex = state.conversations.findIndex(
      (c) => c.jid === message.jid
    );

    let updatedConversations: Conversation[];
    if (existingConvIndex >= 0) {
      // Update existing conversation
      updatedConversations = [...state.conversations];
      updatedConversations[existingConvIndex] = {
        ...updatedConversations[existingConvIndex],
        lastMessage: message,
        messageCount: updatedConversations[existingConvIndex].messageCount + 1,
        unreadCount:
          state.activeJid === message.jid
            ? 0
            : updatedConversations[existingConvIndex].unreadCount + 1,
      };
      // Move to top
      const [conv] = updatedConversations.splice(existingConvIndex, 1);
      updatedConversations.unshift(conv);
    } else {
      // Add new conversation
      updatedConversations = [
        {
          jid: message.jid,
          name: null,
          phone: message.jid.split('@')[0],
          lastMessage: message,
          unreadCount: state.activeJid === message.jid ? 0 : 1,
          messageCount: 1,
        },
        ...state.conversations,
      ];
    }

    // Update messages if this is the active conversation
    const updatedMessages =
      state.activeJid === message.jid
        ? [...state.messages, message]
        : state.messages;

    set({
      conversations: updatedConversations,
      messages: updatedMessages,
    });
  },

  addOutgoingMessage: (message) => {
    const state = get();

    // Update conversations list
    const existingConvIndex = state.conversations.findIndex(
      (c) => c.jid === message.jid
    );

    let updatedConversations: Conversation[];
    if (existingConvIndex >= 0) {
      updatedConversations = [...state.conversations];
      updatedConversations[existingConvIndex] = {
        ...updatedConversations[existingConvIndex],
        lastMessage: message,
        messageCount: updatedConversations[existingConvIndex].messageCount + 1,
      };
      // Move to top
      const [conv] = updatedConversations.splice(existingConvIndex, 1);
      updatedConversations.unshift(conv);
    } else {
      updatedConversations = [
        {
          jid: message.jid,
          name: null,
          phone: message.jid.split('@')[0],
          lastMessage: message,
          unreadCount: 0,
          messageCount: 1,
        },
        ...state.conversations,
      ];
    }

    // Update messages if this is the active conversation
    const updatedMessages =
      state.activeJid === message.jid
        ? [...state.messages, message]
        : state.messages;

    set({
      conversations: updatedConversations,
      messages: updatedMessages,
    });
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, status } : m
      ),
    }));
  },

  // Reset actions
  reset: () => set(initialState),
  resetMessages: () =>
    set({
      messages: [],
      messagesLoading: false,
      messagesError: null,
      hasMore: true,
      page: 1,
    }),
}));
