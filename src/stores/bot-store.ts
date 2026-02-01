'use client';

import { create } from 'zustand';
import type { BotState, BotStats, LogEntry } from '@/lib/socket/events';
import type { Message, User } from '@/types/database';

// =============================================================================
// Activity Types
// =============================================================================

export type ActivityType =
  | 'message_incoming'
  | 'message_outgoing'
  | 'user_joined'
  | 'user_update'
  | 'command_executed'
  | 'bot_connected'
  | 'bot_disconnected'
  | 'error';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Store Interface
// =============================================================================

interface BotStore {
  // Bot connection state
  botState: BotState;

  // Bot statistics
  botStats: BotStats;

  // Recent activity feed
  activities: ActivityItem[];

  // Actions - Bot State
  setBotState: (state: BotState) => void;
  updateBotState: (updates: Partial<BotState>) => void;

  // Actions - Stats
  setBotStats: (stats: BotStats) => void;
  updateBotStats: (updates: Partial<BotStats>) => void;

  // Actions - Activity
  addActivity: (activity: Omit<ActivityItem, 'id'>) => void;
  clearActivities: () => void;

  // Helpers
  addMessageActivity: (message: Message, type: 'incoming' | 'outgoing') => void;
  addUserActivity: (user: User, isNew?: boolean) => void;
  addConnectionActivity: (connected: boolean, phoneNumber?: string) => void;
  addErrorActivity: (error: string) => void;
}

// =============================================================================
// Default Values
// =============================================================================

const defaultBotState: BotState = {
  status: 'disconnected',
  qrCode: null,
  pairingCode: null,
  phoneNumber: null,
  uptime: 0,
};

const defaultBotStats: BotStats = {
  messagesReceived: 0,
  messagesSent: 0,
  commandsExecuted: 0,
  errors: 0,
  uptime: 0,
  activeChats: 0,
  totalUsers: 0,
};

// =============================================================================
// Helper Functions
// =============================================================================

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatPhoneNumber(jid: string): string {
  const phone = jid.split('@')[0];
  if (phone.length > 10) {
    return `+${phone.slice(0, -10)} ${phone.slice(-10, -7)} ${phone.slice(-7, -4)} ${phone.slice(-4)}`;
  }
  return phone;
}

// =============================================================================
// Store
// =============================================================================

const MAX_ACTIVITIES = 50;

export const useBotStore = create<BotStore>((set, get) => ({
  // Initial state
  botState: defaultBotState,
  botStats: defaultBotStats,
  activities: [],

  // Bot State Actions
  setBotState: (state) => set({ botState: state }),

  updateBotState: (updates) => set((state) => ({
    botState: { ...state.botState, ...updates },
  })),

  // Stats Actions
  setBotStats: (stats) => set({ botStats: stats }),

  updateBotStats: (updates) => set((state) => ({
    botStats: { ...state.botStats, ...updates },
  })),

  // Activity Actions
  addActivity: (activity) => set((state) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: generateId(),
    };

    const activities = [newActivity, ...state.activities].slice(0, MAX_ACTIVITIES);
    return { activities };
  }),

  clearActivities: () => set({ activities: [] }),

  // Helper Actions
  addMessageActivity: (message, type) => {
    const isIncoming = type === 'incoming';
    get().addActivity({
      type: isIncoming ? 'message_incoming' : 'message_outgoing',
      title: isIncoming ? 'Message Received' : 'Message Sent',
      description: `${isIncoming ? 'From' : 'To'} ${formatPhoneNumber(message.jid)}`,
      timestamp: Date.now(),
      metadata: {
        jid: message.jid,
        content: message.content?.slice(0, 50),
        messageType: message.type,
      },
    });
  },

  addUserActivity: (user, isNew = false) => {
    get().addActivity({
      type: isNew ? 'user_joined' : 'user_update',
      title: isNew ? 'New User' : 'User Updated',
      description: user.name || formatPhoneNumber(user.jid),
      timestamp: Date.now(),
      metadata: {
        jid: user.jid,
        name: user.name,
        messageCount: user.message_count,
      },
    });
  },

  addConnectionActivity: (connected, phoneNumber) => {
    get().addActivity({
      type: connected ? 'bot_connected' : 'bot_disconnected',
      title: connected ? 'Bot Connected' : 'Bot Disconnected',
      description: connected
        ? `Connected as ${phoneNumber || 'Unknown'}`
        : 'Bot has been disconnected',
      timestamp: Date.now(),
      metadata: { phoneNumber },
    });
  },

  addErrorActivity: (error) => {
    get().addActivity({
      type: 'error',
      title: 'Error',
      description: error,
      timestamp: Date.now(),
    });
  },
}));

// =============================================================================
// Selectors
// =============================================================================

export const selectBotState = (state: BotStore) => state.botState;
export const selectBotStats = (state: BotStore) => state.botStats;
export const selectActivities = (state: BotStore) => state.activities;
export const selectIsConnected = (state: BotStore) => state.botState.status === 'connected';
export const selectIsConnecting = (state: BotStore) => state.botState.status === 'connecting';

// Derived stats
export const selectTotalMessages = (state: BotStore) =>
  state.botStats.messagesReceived + state.botStats.messagesSent;
