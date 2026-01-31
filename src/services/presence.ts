import type { WASocket } from '@whiskeysockets/baileys'
import { createLogger } from '../utils/logger'
import { config } from '../config'
import { sleep, randomDelay } from '../utils/helpers'

const logger = createLogger('presence')

// State
let socket: WASocket | null = null
let presenceInterval: NodeJS.Timeout | null = null
let isOnline = false

// Configuration
const PRESENCE_UPDATE_INTERVAL = 5 * 60 * 1000 // 5 minutes
const PRESENCE_JITTER = 30 * 1000 // 30 seconds jitter

/**
 * Initialize the presence manager with a socket
 */
export function init(sock: WASocket): void {
  socket = sock
  logger.info('Presence manager initialized')
}

/**
 * Set presence to available/online
 */
export async function setAvailable(): Promise<void> {
  if (!socket) {
    logger.warn('Socket not available for presence update')
    return
  }

  // Check if socket is fully connected (has user info)
  if (!socket.user) {
    logger.debug('Socket not fully connected yet, skipping presence update')
    return
  }

  try {
    await socket.sendPresenceUpdate('available')
    isOnline = true
    logger.debug('Presence set to available')
  } catch (error) {
    logger.debug({ err: error }, 'Failed to set presence to available')
  }
}

/**
 * Set presence to unavailable/offline
 */
export async function setUnavailable(): Promise<void> {
  if (!socket) {
    logger.warn('Socket not available for presence update')
    return
  }

  try {
    await socket.sendPresenceUpdate('unavailable')
    isOnline = false
    logger.debug('Presence set to unavailable')
  } catch (error) {
    logger.error({ err: error }, 'Failed to set presence to unavailable')
  }
}

/**
 * Show typing indicator in a chat
 */
export async function showTyping(jid: string): Promise<void> {
  if (!socket || !config.enableTypingIndicator) return

  try {
    await socket.sendPresenceUpdate('composing', jid)
    logger.debug({ jid }, 'Typing indicator shown')
  } catch (error) {
    logger.debug({ err: error, jid }, 'Failed to show typing indicator')
  }
}

/**
 * Hide typing indicator in a chat
 */
export async function hideTyping(jid: string): Promise<void> {
  if (!socket) return

  try {
    await socket.sendPresenceUpdate('paused', jid)
    logger.debug({ jid }, 'Typing indicator hidden')
  } catch (error) {
    logger.debug({ err: error, jid }, 'Failed to hide typing indicator')
  }
}

/**
 * Show recording indicator in a chat
 */
export async function showRecording(jid: string): Promise<void> {
  if (!socket) return

  try {
    await socket.sendPresenceUpdate('recording', jid)
    logger.debug({ jid }, 'Recording indicator shown')
  } catch (error) {
    logger.debug({ err: error, jid }, 'Failed to show recording indicator')
  }
}

/**
 * Simulate typing for a message
 * Duration based on message length and typing speed
 */
export async function simulateTyping(jid: string, messageLength: number): Promise<void> {
  if (!socket || !config.enableTypingIndicator) return

  // Calculate typing duration based on message length
  const baseDuration = Math.min(messageLength * config.typingSpeed, 8000) // Max 8 seconds
  const duration = randomDelay(baseDuration * 0.8, baseDuration * 1.2) // Add some variance

  try {
    await showTyping(jid)
    await sleep(duration)
    await hideTyping(jid)
  } catch (error) {
    logger.debug({ err: error }, 'Error during typing simulation')
  }
}

/**
 * Start periodic presence updates
 */
export function startPeriodicUpdates(): void {
  if (presenceInterval) {
    clearInterval(presenceInterval)
  }

  // Delay initial presence update to let connection stabilize
  setTimeout(async () => {
    if (!socket) return

    try {
      await setAvailable()
    } catch (error) {
      logger.debug({ err: error }, 'Initial presence update failed, will retry')
    }
  }, 3000) // Wait 3 seconds before first presence update

  // Set up periodic updates
  presenceInterval = setInterval(async () => {
    if (!socket) return

    // Add jitter to make updates less predictable
    const jitter = randomDelay(0, PRESENCE_JITTER)
    await sleep(jitter)

    try {
      await setAvailable()
    } catch (error) {
      logger.debug({ err: error }, 'Periodic presence update failed')
    }
  }, PRESENCE_UPDATE_INTERVAL)

  logger.info('Periodic presence updates started')
}

/**
 * Stop periodic presence updates
 */
export function stopPeriodicUpdates(): void {
  if (presenceInterval) {
    clearInterval(presenceInterval)
    presenceInterval = null
    logger.info('Periodic presence updates stopped')
  }
}

/**
 * Subscribe to presence updates for a JID
 */
export async function subscribePresence(jid: string): Promise<void> {
  if (!socket) return

  try {
    await socket.presenceSubscribe(jid)
    logger.debug({ jid }, 'Subscribed to presence')
  } catch (error) {
    logger.debug({ err: error, jid }, 'Failed to subscribe to presence')
  }
}

/**
 * Check if currently online
 */
export function getStatus(): boolean {
  return isOnline
}

/**
 * Clean up
 */
export function cleanup(): void {
  stopPeriodicUpdates()
  socket = null
  isOnline = false
  logger.info('Presence manager cleaned up')
}

export default {
  init,
  setAvailable,
  setUnavailable,
  showTyping,
  hideTyping,
  showRecording,
  simulateTyping,
  startPeriodicUpdates,
  stopPeriodicUpdates,
  subscribePresence,
  getStatus,
  cleanup,
}
