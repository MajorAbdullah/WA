import type { WASocket, proto, WAMessage, AnyMessageContent } from '@whiskeysockets/baileys'

// Re-export Baileys types for convenience
export type { WASocket, WAMessage, AnyMessageContent }
export type WAProto = proto.IWebMessageInfo

// Connection states
export type ConnectionState = 'connecting' | 'open' | 'closing' | 'close'

// Bot client interface
export interface BotClient {
  socket: WASocket
  startTime: Date
  isConnected: boolean
}

// Parsed command structure
export interface ParsedCommand {
  name: string
  args: string[]
  rawArgs: string
  prefix: string
  isCommand: boolean
}

// Command context passed to command handlers
export interface CommandContext {
  socket: WASocket
  message: WAMessage
  sender: string
  senderName: string
  senderNumber: string
  isGroup: boolean
  groupId: string | null
  groupName: string | null
  isOwner: boolean
  isGroupAdmin: boolean
  args: string[]
  rawArgs: string
  prefix: string
  commandName: string
  reply: (text: string) => Promise<void>
  react: (emoji: string) => Promise<void>
  sendMessage: (content: AnyMessageContent) => Promise<void>
}

// Command definition
export interface Command {
  name: string
  aliases?: string[]
  description: string
  usage?: string
  example?: string
  category: CommandCategory
  cooldown?: number // seconds
  ownerOnly?: boolean
  groupOnly?: boolean
  privateOnly?: boolean
  adminOnly?: boolean
  execute: (ctx: CommandContext) => Promise<void>
}

export type CommandCategory = 'general' | 'admin' | 'owner' | 'utility' | 'fun'

// Rate limiter types
export interface RateLimitEntry {
  timestamps: number[]
  blocked: boolean
  blockedUntil?: number
}

export interface RateLimitConfig {
  limit: number
  window: number // milliseconds
}

// Message queue types
export interface QueuedMessage {
  id: string
  jid: string
  content: AnyMessageContent
  options?: MessageSendOptions
  priority: number
  timestamp: number
  retries: number
}

export interface MessageSendOptions {
  quoted?: WAMessage
  mentions?: string[]
}

// User data
export interface UserData {
  jid: string
  name?: string
  isBanned: boolean
  isOwner: boolean
  firstSeen: Date
  lastSeen: Date
  messageCount: number
  commandCount: number
}

// Bot statistics
export interface BotStats {
  startTime: Date
  uptime: number
  messagesReceived: number
  messagesSent: number
  commandsExecuted: number
  errors: number
}

// Event types for internal use
export interface MessageEvent {
  message: WAMessage
  type: 'notify' | 'append'
}

// Helper type for JID
export type JID = string

// Group metadata
export interface GroupInfo {
  id: string
  name: string
  participants: GroupParticipant[]
  admins: string[]
  owner?: string
}

export interface GroupParticipant {
  jid: string
  isAdmin: boolean
  isSuperAdmin: boolean
}
