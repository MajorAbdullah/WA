/**
 * Bot Service Types
 * TypeScript types for the bot state and related interfaces
 */

import type { WAMessage, AnyMessageContent } from '@whiskeysockets/baileys';

// Re-export useful types from wa-bot-cli
export type { WAMessage, AnyMessageContent };

/**
 * Connection status states
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Bot connection state
 */
export interface BotState {
  /** Current connection status */
  status: ConnectionStatus;
  /** QR code data URL for scanning (when connecting) */
  qrCode: string | null;
  /** Pairing code for linking (when connecting) */
  pairingCode: string | null;
  /** Connected phone number (when connected) */
  phoneNumber: string | null;
  /** Bot uptime in milliseconds */
  uptime: number;
  /** Bot name from config */
  botName: string;
  /** Last connection time */
  lastConnected: Date | null;
  /** Last disconnection time */
  lastDisconnected: Date | null;
}

/**
 * Bot statistics
 */
export interface BotStats {
  /** Total messages received */
  messagesReceived: number;
  /** Total messages sent */
  messagesSent: number;
  /** Total commands executed */
  commandsExecuted: number;
  /** Total errors encountered */
  errors: number;
  /** Bot uptime in milliseconds */
  uptime: number;
  /** Start time of the bot */
  startTime: Date | null;
}

/**
 * Extended bot statistics including anti-ban services
 */
export interface ExtendedBotStats extends BotStats {
  /** Rate limit service stats */
  rateLimit: {
    globalRequests: number;
    trackedUsers: number;
    trackedGroups: number;
    blockedUsers: number;
    blockedGroups: number;
  };
  /** Message queue stats */
  queue: {
    size: number;
    isProcessing: boolean;
    byPriority: Record<string, number>;
  };
  /** Anti-spam stats */
  antiSpam: {
    trackedJids: number;
    totalHashes: number;
    totalTexts: number;
  };
}

/**
 * User data from the bot
 */
export interface BotUser {
  /** WhatsApp JID (unique identifier) */
  jid: string;
  /** Display name */
  name?: string;
  /** Phone number extracted from JID */
  phone: string;
  /** Whether user is banned */
  isBanned: boolean;
  /** Whether user is bot owner */
  isOwner: boolean;
  /** First interaction timestamp */
  firstSeen: Date;
  /** Last interaction timestamp */
  lastSeen: Date;
  /** Total messages from this user */
  messageCount: number;
  /** Total commands executed by this user */
  commandCount: number;
  /** Warning count */
  warnings: number;
}

/**
 * Group information
 */
export interface BotGroup {
  /** Group JID */
  id: string;
  /** Group name */
  name: string;
  /** Group participants */
  participants: BotGroupParticipant[];
  /** Admin JIDs */
  admins: string[];
  /** Group owner JID */
  owner?: string;
}

/**
 * Group participant
 */
export interface BotGroupParticipant {
  /** Participant JID */
  jid: string;
  /** Whether participant is admin */
  isAdmin: boolean;
  /** Whether participant is super admin */
  isSuperAdmin: boolean;
}

/**
 * Message to send via the bot
 */
export interface SendMessageOptions {
  /** Target JID (user or group) */
  jid: string;
  /** Message content */
  content: AnyMessageContent;
  /** Optional quoted message */
  quotedMessage?: WAMessage;
  /** Optional mentions */
  mentions?: string[];
  /** Message priority */
  priority?: MessagePriority;
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

/**
 * Bot command definition
 */
export interface BotCommand {
  /** Command name (without prefix) */
  name: string;
  /** Command aliases */
  aliases: string[];
  /** Command description */
  description: string;
  /** Usage example */
  usage?: string;
  /** Example invocation */
  example?: string;
  /** Command category */
  category: CommandCategory;
  /** Cooldown in seconds */
  cooldown: number;
  /** Whether only owner can use */
  ownerOnly: boolean;
  /** Whether command is enabled */
  enabled: boolean;
  /** Usage count */
  usageCount: number;
}

/**
 * Command categories
 */
export type CommandCategory = 'general' | 'admin' | 'owner' | 'utility' | 'fun';

/**
 * Bot event types
 */
export type BotEventType =
  | 'connection'
  | 'qr'
  | 'pairing-code'
  | 'message:incoming'
  | 'message:outgoing'
  | 'message:status'
  | 'user:update'
  | 'stats:update'
  | 'error';

/**
 * Bot event payloads
 */
export interface BotEventPayloads {
  connection: { status: ConnectionStatus; phoneNumber?: string };
  qr: { qrCode: string };
  'pairing-code': { code: string };
  'message:incoming': { message: WAMessage; jid: string; fromMe: boolean };
  'message:outgoing': { message: WAMessage; jid: string };
  'message:status': { messageId: string; status: MessageStatus };
  'user:update': { user: BotUser };
  'stats:update': { stats: BotStats };
  error: { error: Error; context?: string };
}

/**
 * Message delivery status
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Bot configuration
 */
export interface BotConfig {
  /** Bot display name */
  name: string;
  /** Command prefix */
  prefix: string;
  /** Owner phone number */
  ownerNumber: string;
  /** Whether to process group messages */
  enableGroups: boolean;
  /** Whether to auto-read messages */
  autoRead: boolean;
  /** Whether to show typing indicator */
  showTyping: boolean;
  /** Minimum response delay in ms */
  minDelay: number;
  /** Maximum response delay in ms */
  maxDelay: number;
}

/**
 * Session information
 */
export interface SessionInfo {
  /** Whether session exists */
  exists: boolean;
  /** Session folder path */
  path: string;
  /** Connected phone number */
  phoneNumber?: string;
  /** Session age in milliseconds */
  age?: number;
}
