// WebSocket event type definitions for the WA Bot Dashboard
// Uses Socket.IO typed events for type-safe real-time communication

import type { Message, User, CommandLog } from '@/types/database';

// =============================================================================
// Connection Status Types
// =============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface BotState {
  status: ConnectionStatus;
  qrCode: string | null;
  pairingCode: string | null;
  phoneNumber: string | null;
  uptime: number;
}

export interface BotStats {
  messagesReceived: number;
  messagesSent: number;
  commandsExecuted: number;
  errors: number;
  uptime: number;
  activeChats: number;
  totalUsers: number;
}

// =============================================================================
// Log Types
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Message Status Types
// =============================================================================

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageStatusUpdate {
  messageId: string;
  status: MessageStatus;
  timestamp: number;
}

// =============================================================================
// Server -> Client Events
// =============================================================================

export interface ServerToClientEvents {
  // Bot connection status changes
  'connection:status': (state: BotState) => void;

  // New incoming message received by bot
  'message:incoming': (message: Message) => void;

  // Message sent by bot
  'message:outgoing': (message: Message) => void;

  // Message delivery status update
  'message:status': (update: MessageStatusUpdate) => void;

  // User data changed (new user, updated stats, etc.)
  'user:update': (user: User) => void;

  // Statistics updated (sent periodically)
  'stats:update': (stats: BotStats) => void;

  // New log entry
  'log:entry': (log: LogEntry) => void;

  // Command executed
  'command:executed': (log: CommandLog) => void;

  // QR code updated for connection
  'qr:update': (qrCode: string) => void;

  // Pairing code for phone number connection
  'pairing:code': (code: string) => void;

  // Error event
  'error': (error: { code: string; message: string }) => void;
}

// =============================================================================
// Client -> Server Events
// =============================================================================

export interface ClientToServerEvents {
  // Request bot to connect
  'bot:connect': (options?: { usePairingCode?: boolean; phoneNumber?: string }) => void;

  // Request bot to disconnect
  'bot:disconnect': () => void;

  // Send a message through the bot
  'message:send': (data: SendMessageData) => void;

  // Subscribe to log updates
  'subscribe:logs': (options?: { level?: LogLevel }) => void;

  // Unsubscribe from log updates
  'unsubscribe:logs': () => void;

  // Request current bot status
  'bot:status': () => void;

  // Request current statistics
  'stats:request': () => void;

  // Join a room for specific chat updates
  'chat:join': (jid: string) => void;

  // Leave a chat room
  'chat:leave': (jid: string) => void;
}

// =============================================================================
// Inter-Server Events (for internal use)
// =============================================================================

export interface InterServerEvents {
  ping: () => void;
}

// =============================================================================
// Socket Data Types
// =============================================================================

export interface SocketData {
  userId?: string;
  subscribedToLogs: boolean;
  logLevel?: LogLevel;
  joinedChats: Set<string>;
}

// =============================================================================
// Payload Types
// =============================================================================

export interface SendMessageData {
  jid: string;
  text: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  caption?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// Room Names
// =============================================================================

export const ROOMS = {
  LOGS: 'logs',
  STATS: 'stats',
  ADMIN: 'admin',
  chatRoom: (jid: string) => `chat:${jid}`,
} as const;

// =============================================================================
// Event Names (for consistency)
// =============================================================================

export const EVENTS = {
  // Server -> Client
  CONNECTION_STATUS: 'connection:status',
  MESSAGE_INCOMING: 'message:incoming',
  MESSAGE_OUTGOING: 'message:outgoing',
  MESSAGE_STATUS: 'message:status',
  USER_UPDATE: 'user:update',
  STATS_UPDATE: 'stats:update',
  LOG_ENTRY: 'log:entry',
  COMMAND_EXECUTED: 'command:executed',
  QR_UPDATE: 'qr:update',
  PAIRING_CODE: 'pairing:code',
  ERROR: 'error',

  // Client -> Server
  BOT_CONNECT: 'bot:connect',
  BOT_DISCONNECT: 'bot:disconnect',
  MESSAGE_SEND: 'message:send',
  SUBSCRIBE_LOGS: 'subscribe:logs',
  UNSUBSCRIBE_LOGS: 'unsubscribe:logs',
  BOT_STATUS: 'bot:status',
  STATS_REQUEST: 'stats:request',
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
} as const;

// =============================================================================
// Type Exports for Socket.IO
// =============================================================================

// This type can be used when creating a Socket.IO server
export type TypedServer = import('socket.io').Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// This type can be used when creating a Socket.IO client
export type TypedSocket = import('socket.io').Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// This type can be used on the client side
export type TypedClientSocket = import('socket.io-client').Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;
