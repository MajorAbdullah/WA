/**
 * Bot Adapter - Wraps @syed-abdullah-shah/wa-bot-cli exports for dashboard use
 * Provides a clean interface between the CLI package and the dashboard
 */

import type {
  BotUser,
  BotStats,
  ExtendedBotStats,
  BotCommand,
  SendMessageOptions,
  MessagePriority,
  SessionInfo,
} from '@/types/bot';

// Import from wa-bot-cli package
// Using dynamic imports where needed for Next.js compatibility
let cliClient: typeof import('@syed-abdullah-shah/wa-bot-cli/dist/core/client') | null = null;
let cliConnection: typeof import('@syed-abdullah-shah/wa-bot-cli/dist/core/connection') | null = null;
let cliSession: typeof import('@syed-abdullah-shah/wa-bot-cli/dist/core/session') | null = null;
let cliUsers: typeof import('@syed-abdullah-shah/wa-bot-cli/dist/services/users') | null = null;

/**
 * Lazy load the CLI modules (server-side only)
 */
async function loadCLIModules(): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error('Bot adapter can only be used on the server side');
  }

  if (!cliClient) {
    cliClient = await import('@syed-abdullah-shah/wa-bot-cli/dist/core/client');
  }
  if (!cliConnection) {
    cliConnection = await import('@syed-abdullah-shah/wa-bot-cli/dist/core/connection');
  }
  if (!cliSession) {
    cliSession = await import('@syed-abdullah-shah/wa-bot-cli/dist/core/session');
  }
  if (!cliUsers) {
    cliUsers = await import('@syed-abdullah-shah/wa-bot-cli/dist/services/users');
  }
}

/**
 * Extract phone number from JID
 */
function extractPhoneFromJid(jid: string): string {
  return jid.split('@')[0] || jid;
}

/**
 * Convert CLI UserData to dashboard BotUser
 */
function convertUser(cliUser: {
  jid: string;
  name?: string;
  isBanned: boolean;
  isOwner: boolean;
  firstSeen: Date;
  lastSeen: Date;
  messageCount: number;
  commandCount: number;
  warnings?: number;
}): BotUser {
  return {
    jid: cliUser.jid,
    name: cliUser.name,
    phone: extractPhoneFromJid(cliUser.jid),
    isBanned: cliUser.isBanned,
    isOwner: cliUser.isOwner,
    firstSeen: new Date(cliUser.firstSeen),
    lastSeen: new Date(cliUser.lastSeen),
    messageCount: cliUser.messageCount,
    commandCount: cliUser.commandCount,
    warnings: cliUser.warnings ?? 0,
  };
}

// ============================================================================
// Connection Adapter Functions
// ============================================================================

/**
 * Start the bot and connect to WhatsApp
 */
export async function startBot(options?: { usePairingCode?: boolean; phoneNumber?: string }): Promise<void> {
  await loadCLIModules();

  // If phone number provided, use pairing code authentication
  if (options?.phoneNumber) {
    // Set the phone number for pairing code auth
    process.env.PHONE_NUMBER = options.phoneNumber;
  }

  await cliClient!.startBot();
}

/**
 * Stop the bot gracefully
 */
export async function stopBot(): Promise<void> {
  await loadCLIModules();
  await cliClient!.stopBot();
}

/**
 * Logout and stop the bot (clears session)
 */
export async function logoutBot(): Promise<void> {
  await loadCLIModules();
  await cliClient!.logoutBot();
}

/**
 * Check if the bot is connected
 */
export async function isConnected(): Promise<boolean> {
  await loadCLIModules();
  return cliConnection!.isConnected();
}

/**
 * Get the current socket instance
 */
export async function getSocket() {
  await loadCLIModules();
  return cliConnection!.getSocket();
}

/**
 * Set callback for connection state changes
 */
export async function setConnectionCallback(
  callback: (state: { connection?: string; lastDisconnect?: { error?: Error }; qr?: string }) => void
): Promise<void> {
  await loadCLIModules();
  console.log('[Bot Adapter] Setting connection callback...');
  cliClient!.setConnectionCallback((state: unknown) => {
    console.log('[Bot Adapter] Connection callback received:', JSON.stringify(state));
    callback(state as { connection?: string; lastDisconnect?: { error?: Error }; qr?: string });
  });
  console.log('[Bot Adapter] Connection callback set');
}

/**
 * Set callback for incoming messages
 */
export async function setMessageCallback(
  callback: (messages: unknown) => void
): Promise<void> {
  await loadCLIModules();
  cliClient!.setMessageCallback(callback);
}

// ============================================================================
// Message Adapter Functions
// ============================================================================

/**
 * Send a message with anti-ban protections
 */
export async function sendMessage(options: SendMessageOptions): Promise<void> {
  await loadCLIModules();

  const msgOptions = options.quotedMessage
    ? { quoted: options.quotedMessage, mentions: options.mentions }
    : options.mentions
    ? { mentions: options.mentions }
    : undefined;

  await cliClient!.sendMessage(options.jid, options.content, msgOptions);
}

/**
 * Send a text message
 */
export async function sendTextMessage(jid: string, text: string): Promise<void> {
  await loadCLIModules();
  await cliClient!.sendText(jid, text);
}

/**
 * Queue a message for sending (for non-urgent messages)
 */
export async function queueMessage(
  jid: string,
  content: unknown,
  priority: MessagePriority = 1
): Promise<string> {
  await loadCLIModules();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cliClient!.queueMessage(jid, content as any, undefined, priority);
}

/**
 * Mark messages as read
 */
export async function markAsRead(jid: string, messageKeys: unknown[]): Promise<void> {
  await loadCLIModules();
  await cliClient!.markAsRead(jid, messageKeys);
}

// ============================================================================
// Stats Adapter Functions
// ============================================================================

/**
 * Get basic bot statistics
 */
export async function getStats(): Promise<BotStats> {
  await loadCLIModules();
  const stats = cliClient!.getStats();

  return {
    messagesReceived: stats.messagesReceived,
    messagesSent: stats.messagesSent,
    commandsExecuted: stats.commandsExecuted,
    errors: stats.errors,
    uptime: stats.uptime,
    startTime: stats.startTime ? new Date(stats.startTime) : null,
  };
}

/**
 * Get extended bot statistics including anti-ban services
 */
export async function getExtendedStats(): Promise<ExtendedBotStats> {
  await loadCLIModules();
  const extended = cliClient!.getExtendedStats();

  return {
    messagesReceived: extended.bot.messagesReceived,
    messagesSent: extended.bot.messagesSent,
    commandsExecuted: extended.bot.commandsExecuted,
    errors: extended.bot.errors,
    uptime: extended.bot.uptime,
    startTime: extended.bot.startTime ? new Date(extended.bot.startTime) : null,
    rateLimit: {
      globalRequests: extended.rateLimit?.globalRequests ?? 0,
      trackedUsers: extended.rateLimit?.trackedUsers ?? 0,
      trackedGroups: extended.rateLimit?.trackedGroups ?? 0,
      blockedUsers: extended.rateLimit?.blockedUsers ?? 0,
      blockedGroups: extended.rateLimit?.blockedGroups ?? 0,
    },
    queue: {
      size: extended.queue?.size ?? 0,
      isProcessing: extended.queue?.isProcessing ?? false,
      byPriority: extended.queue?.byPriority ?? {},
    },
    antiSpam: {
      trackedJids: extended.antiSpam?.trackedJids ?? 0,
      totalHashes: extended.antiSpam?.totalHashes ?? 0,
      totalTexts: extended.antiSpam?.totalTexts ?? 0,
    },
  };
}

/**
 * Increment a stat counter
 */
export async function incrementStat(
  key: 'messagesReceived' | 'messagesSent' | 'commandsExecuted' | 'errors'
): Promise<void> {
  await loadCLIModules();
  cliClient!.incrementStat(key);
}

// ============================================================================
// User Adapter Functions
// ============================================================================

/**
 * Get all users
 */
export async function getUsers(): Promise<BotUser[]> {
  await loadCLIModules();
  const users = cliUsers!.getAllUsers();
  return users.map(convertUser);
}

/**
 * Get a specific user
 */
export async function getUser(jid: string): Promise<BotUser | null> {
  await loadCLIModules();
  if (!cliUsers!.hasUser(jid)) {
    return null;
  }
  const user = cliUsers!.getUser(jid);
  return convertUser(user);
}

/**
 * Get banned users
 */
export async function getBannedUsers(): Promise<BotUser[]> {
  await loadCLIModules();
  const users = cliUsers!.getBannedUsers();
  return users.map(convertUser);
}

/**
 * Ban a user
 */
export async function banUser(jid: string, reason?: string): Promise<boolean> {
  await loadCLIModules();
  return cliUsers!.banUser(jid, reason);
}

/**
 * Unban a user
 */
export async function unbanUser(jid: string): Promise<boolean> {
  await loadCLIModules();
  return cliUsers!.unbanUser(jid);
}

/**
 * Check if a user is banned
 */
export async function isBanned(jid: string): Promise<boolean> {
  await loadCLIModules();
  return cliUsers!.isBanned(jid);
}

/**
 * Warn a user
 */
export async function warnUser(jid: string): Promise<number> {
  await loadCLIModules();
  return cliUsers!.warnUser(jid);
}

/**
 * Clear warnings for a user
 */
export async function clearWarnings(jid: string): Promise<void> {
  await loadCLIModules();
  cliUsers!.clearWarnings(jid);
}

/**
 * Delete a user
 */
export async function deleteUser(jid: string): Promise<boolean> {
  await loadCLIModules();
  return cliUsers!.deleteUser(jid);
}

/**
 * Get user count
 */
export async function getUserCount(): Promise<number> {
  await loadCLIModules();
  return cliUsers!.getUserCount();
}

/**
 * Get user stats
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  bannedUsers: number;
  totalMessages: number;
  totalCommands: number;
}> {
  await loadCLIModules();
  return cliUsers!.getStats();
}

// ============================================================================
// Session Adapter Functions
// ============================================================================

/**
 * Check if a session exists
 */
export async function sessionExists(): Promise<boolean> {
  await loadCLIModules();
  return cliSession!.sessionExists();
}

/**
 * Clear the current session
 */
export async function clearSession(): Promise<void> {
  await loadCLIModules();
  await cliSession!.clearSession();
}

/**
 * Get session information
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  await loadCLIModules();
  const exists = cliSession!.sessionExists();
  const authFolder = process.env.AUTH_FOLDER || './data/auth';

  return {
    exists,
    path: authFolder,
    phoneNumber: undefined, // Would need to be extracted from session if available
    age: undefined, // Would need to calculate from session creation time
  };
}

// ============================================================================
// Command Adapter Functions (placeholder - commands are loaded from CLI)
// ============================================================================

/**
 * Get all registered commands
 * Note: This would need to be implemented based on how commands are stored in wa-bot-cli
 */
export async function getCommands(): Promise<BotCommand[]> {
  // TODO: Implement command registry access from wa-bot-cli
  // For now, return empty array - will be populated when command registry is exposed
  return [];
}

/**
 * Get a specific command
 */
export async function getCommand(name: string): Promise<BotCommand | null> {
  const commands = await getCommands();
  return commands.find((cmd) => cmd.name === name || cmd.aliases.includes(name)) || null;
}

// ============================================================================
// Export Priority constant for message queuing
// ============================================================================

export const Priority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  URGENT: 3,
} as const;
