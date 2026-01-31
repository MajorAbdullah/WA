import { WASocket, AnyMessageContent, MiscMessageGenerationOptions } from '@whiskeysockets/baileys'
import { createLogger } from '../utils/logger'
import { config } from '../config'
import {
  connect,
  disconnect,
  close,
  getSocket,
  isConnected,
  setConnectionCallback,
  setMessageCallback,
} from './connection'
import { BotClient, BotStats } from '../types'
import { sleep, randomDelay, isGroupJid } from '../utils/helpers'
import { canSend, recordSend, getStats as getRateLimitStats } from '../services/rateLimit'
import { enqueue, setSendFunction, getStats as getQueueStats, clear as clearQueue, Priority } from '../services/queue'
import { isDuplicate, recordMessage, addVariation, getStats as getAntiSpamStats } from '../services/antiSpam'
import { init as initPresence, simulateTyping, startPeriodicUpdates, stopPeriodicUpdates, cleanup as cleanupPresence } from '../services/presence'

const logger = createLogger('client')

// Bot state
let startTime: Date | null = null
let stats: BotStats = {
  startTime: new Date(),
  uptime: 0,
  messagesReceived: 0,
  messagesSent: 0,
  commandsExecuted: 0,
  errors: 0,
}

/**
 * Get the current bot client
 */
export function getClient(): BotClient | null {
  const socket = getSocket()
  if (!socket || !startTime) return null

  return {
    socket,
    startTime,
    isConnected: isConnected(),
  }
}

/**
 * Get bot statistics
 */
export function getStats(): BotStats {
  return {
    ...stats,
    uptime: startTime ? Date.now() - startTime.getTime() : 0,
  }
}

/**
 * Get extended statistics including anti-ban services
 */
export function getExtendedStats(): {
  bot: BotStats
  rateLimit: ReturnType<typeof getRateLimitStats>
  queue: ReturnType<typeof getQueueStats>
  antiSpam: ReturnType<typeof getAntiSpamStats>
} {
  return {
    bot: getStats(),
    rateLimit: getRateLimitStats(),
    queue: getQueueStats(),
    antiSpam: getAntiSpamStats(),
  }
}

/**
 * Increment a stat counter
 */
export function incrementStat(key: keyof Pick<BotStats, 'messagesReceived' | 'messagesSent' | 'commandsExecuted' | 'errors'>): void {
  stats[key]++
}

/**
 * Internal send function (bypasses queue for direct sending)
 */
async function internalSend(
  jid: string,
  content: AnyMessageContent,
  options?: MiscMessageGenerationOptions
): Promise<void> {
  const socket = getSocket()
  if (!socket) {
    throw new Error('Socket not connected')
  }

  try {
    // Add random delay before sending (anti-ban)
    const delay = randomDelay(config.minResponseDelay, config.maxResponseDelay)
    await sleep(delay)

    // Show typing indicator if enabled and content is text
    if (config.enableTypingIndicator && 'text' in content) {
      const text = content.text as string
      await simulateTyping(jid, text?.length || 20)
    }

    // Send the message
    await socket.sendMessage(jid, content, options)
    stats.messagesSent++

    // Record for anti-spam if text message
    if ('text' in content) {
      recordMessage(jid, content.text as string)
    }

    logger.debug({ jid }, 'Message sent')
  } catch (error) {
    stats.errors++
    logger.error({ err: error, jid }, 'Failed to send message')
    throw error
  }
}

/**
 * Send a message with anti-ban protections
 * Uses rate limiting and queue system
 */
export async function sendMessage(
  jid: string,
  content: AnyMessageContent,
  options?: MiscMessageGenerationOptions
): Promise<void> {
  const isGroup = isGroupJid(jid)

  // Check rate limit
  if (!canSend(jid, isGroup)) {
    logger.warn({ jid }, 'Rate limit reached, queueing message')
    return new Promise((resolve, reject) => {
      enqueue(jid, content, options, Priority.NORMAL, (success, error) => {
        if (success) resolve()
        else reject(error || new Error('Failed to send queued message'))
      })
    })
  }

  // Check for duplicate (text messages only)
  if ('text' in content) {
    const text = content.text as string
    if (isDuplicate(jid, text)) {
      logger.debug({ jid }, 'Duplicate message detected, adding variation')
      content = { ...content, text: addVariation(text) }
    }
  }

  // Record the send for rate limiting
  recordSend(jid, isGroup)

  // Send directly
  await internalSend(jid, content, options)
}

/**
 * Send a message through the queue (for non-urgent messages)
 */
export function queueMessage(
  jid: string,
  content: AnyMessageContent,
  options?: MiscMessageGenerationOptions,
  priority: typeof Priority[keyof typeof Priority] = Priority.NORMAL
): string {
  return enqueue(jid, content, options, priority)
}

/**
 * Send a text message
 */
export async function sendText(
  jid: string,
  text: string,
  options?: MiscMessageGenerationOptions
): Promise<void> {
  await sendMessage(jid, { text }, options)
}

/**
 * Send a reply to a message
 */
export async function sendReply(
  jid: string,
  text: string,
  quotedMessage: any
): Promise<void> {
  await sendMessage(jid, { text }, { quoted: quotedMessage })
}

/**
 * Send a reaction to a message
 * Reactions bypass rate limiting since they're lightweight
 */
export async function sendReaction(
  jid: string,
  emoji: string,
  messageKey: any
): Promise<void> {
  const socket = getSocket()
  if (!socket) {
    throw new Error('Socket not connected')
  }

  await socket.sendMessage(jid, {
    react: {
      text: emoji,
      key: messageKey,
    },
  })
}

/**
 * Mark messages as read
 */
export async function markAsRead(_jid: string, messageKeys: any[]): Promise<void> {
  const socket = getSocket()
  if (!socket || !config.enableAutoRead) return

  try {
    await socket.readMessages(messageKeys)
  } catch (error) {
    logger.debug({ err: error }, 'Failed to mark messages as read')
  }
}

/**
 * Start the bot
 */
export async function startBot(): Promise<WASocket> {
  logger.info('Starting bot...')
  startTime = new Date()
  stats = {
    startTime,
    uptime: 0,
    messagesReceived: 0,
    messagesSent: 0,
    commandsExecuted: 0,
    errors: 0,
  }

  // Connect to WhatsApp
  const socket = await connect()

  // Initialize services
  initPresence(socket)
  setSendFunction(internalSend)

  // Start presence updates when connected
  setConnectionCallback((update) => {
    if (update.connection === 'open') {
      startPeriodicUpdates()
    }
  })

  return socket
}

/**
 * Stop the bot
 */
export async function stopBot(): Promise<void> {
  logger.info('Stopping bot...')

  // Cleanup services
  stopPeriodicUpdates()
  cleanupPresence()
  clearQueue()

  await close()
  startTime = null
}

/**
 * Logout and stop the bot
 */
export async function logoutBot(): Promise<void> {
  logger.info('Logging out...')

  // Cleanup services
  stopPeriodicUpdates()
  cleanupPresence()
  clearQueue()

  await disconnect()
  startTime = null
}

// Re-export connection utilities
export {
  getSocket,
  isConnected,
  setConnectionCallback,
  setMessageCallback,
}

// Re-export queue priority
export { Priority }

export default {
  startBot,
  stopBot,
  logoutBot,
  getClient,
  getStats,
  getExtendedStats,
  incrementStat,
  sendMessage,
  queueMessage,
  sendText,
  sendReply,
  sendReaction,
  markAsRead,
  getSocket,
  isConnected,
  setConnectionCallback,
  setMessageCallback,
  Priority,
}
