import type { AnyMessageContent, MiscMessageGenerationOptions } from '@whiskeysockets/baileys'
import { createLogger } from '../utils/logger'
import { config } from '../config'
import { sleep, randomDelay, generateId } from '../utils/helpers'
import { canSend, recordSend } from './rateLimit'
import { isGroupJid } from '../utils/helpers'

const logger = createLogger('queue')

// Priority levels
export const Priority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  URGENT: 3,
} as const

export type PriorityLevel = typeof Priority[keyof typeof Priority]

export interface QueuedMessage {
  id: string
  jid: string
  content: AnyMessageContent
  options?: MiscMessageGenerationOptions
  priority: PriorityLevel
  timestamp: number
  retries: number
  maxRetries: number
  callback?: (success: boolean, error?: Error) => void
}

// Queue state
const queue: QueuedMessage[] = []
let isProcessing = false
let processingTimeout: NodeJS.Timeout | null = null

// Send function reference (set by client)
let sendFunction: ((jid: string, content: AnyMessageContent, options?: MiscMessageGenerationOptions) => Promise<void>) | null = null

// Configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 5000
const MIN_DELAY_BETWEEN_MESSAGES = 1000
const MAX_DELAY_BETWEEN_MESSAGES = 3000

/**
 * Set the send function to use
 */
export function setSendFunction(fn: typeof sendFunction): void {
  sendFunction = fn
}

/**
 * Add a message to the queue
 */
export function enqueue(
  jid: string,
  content: AnyMessageContent,
  options?: MiscMessageGenerationOptions,
  priority: PriorityLevel = Priority.NORMAL,
  callback?: (success: boolean, error?: Error) => void
): string {
  const message: QueuedMessage = {
    id: generateId(),
    jid,
    content,
    options,
    priority,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: MAX_RETRIES,
    callback,
  }

  // Insert based on priority (higher priority first)
  let inserted = false
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].priority < priority) {
      queue.splice(i, 0, message)
      inserted = true
      break
    }
  }

  if (!inserted) {
    queue.push(message)
  }

  logger.debug({
    id: message.id,
    jid,
    priority,
    queueSize: queue.length,
  }, 'Message enqueued')

  // Start processing if not already
  startProcessing()

  return message.id
}

/**
 * Start processing the queue
 */
function startProcessing(): void {
  if (isProcessing || queue.length === 0) return

  isProcessing = true
  processNext()
}

/**
 * Process the next message in the queue
 */
async function processNext(): Promise<void> {
  if (queue.length === 0) {
    isProcessing = false
    return
  }

  const message = queue[0]
  const isGroup = isGroupJid(message.jid)

  // Check rate limit
  if (!canSend(message.jid, isGroup)) {
    logger.debug({ jid: message.jid }, 'Rate limited, waiting...')
    // Wait and retry
    processingTimeout = setTimeout(() => processNext(), 5000)
    return
  }

  // Remove from queue
  queue.shift()

  try {
    if (!sendFunction) {
      throw new Error('Send function not set')
    }

    // Add random delay for human-like behavior
    const delay = randomDelay(MIN_DELAY_BETWEEN_MESSAGES, MAX_DELAY_BETWEEN_MESSAGES)
    await sleep(delay)

    // Send the message
    await sendFunction(message.jid, message.content, message.options)

    // Record the send for rate limiting
    recordSend(message.jid, isGroup)

    logger.debug({ id: message.id, jid: message.jid }, 'Message sent from queue')

    // Call success callback
    if (message.callback) {
      message.callback(true)
    }
  } catch (error) {
    logger.error({ err: error, id: message.id }, 'Failed to send queued message')

    // Retry if possible
    if (message.retries < message.maxRetries) {
      message.retries++
      logger.info({
        id: message.id,
        retry: message.retries,
        maxRetries: message.maxRetries,
      }, 'Retrying message')

      // Re-add to queue with delay
      await sleep(RETRY_DELAY)
      queue.unshift(message) // Add to front
    } else {
      logger.error({ id: message.id }, 'Max retries exceeded, dropping message')

      // Call failure callback
      if (message.callback) {
        message.callback(false, error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  // Process next message
  const nextDelay = randomDelay(config.minResponseDelay, config.maxResponseDelay)
  processingTimeout = setTimeout(() => processNext(), nextDelay)
}

/**
 * Remove a message from the queue
 */
export function remove(id: string): boolean {
  const index = queue.findIndex(m => m.id === id)
  if (index !== -1) {
    queue.splice(index, 1)
    logger.debug({ id }, 'Message removed from queue')
    return true
  }
  return false
}

/**
 * Clear the entire queue
 */
export function clear(): void {
  const count = queue.length
  queue.length = 0

  if (processingTimeout) {
    clearTimeout(processingTimeout)
    processingTimeout = null
  }

  isProcessing = false
  logger.info({ count }, 'Queue cleared')
}

/**
 * Get the current queue size
 */
export function size(): number {
  return queue.length
}

/**
 * Get queue statistics
 */
export function getStats(): {
  size: number
  isProcessing: boolean
  byPriority: Record<string, number>
} {
  const byPriority: Record<string, number> = {
    urgent: 0,
    high: 0,
    normal: 0,
    low: 0,
  }

  for (const msg of queue) {
    switch (msg.priority) {
      case Priority.URGENT: byPriority.urgent++; break
      case Priority.HIGH: byPriority.high++; break
      case Priority.NORMAL: byPriority.normal++; break
      case Priority.LOW: byPriority.low++; break
    }
  }

  return {
    size: queue.length,
    isProcessing,
    byPriority,
  }
}

/**
 * Pause queue processing
 */
export function pause(): void {
  if (processingTimeout) {
    clearTimeout(processingTimeout)
    processingTimeout = null
  }
  isProcessing = false
  logger.info('Queue processing paused')
}

/**
 * Resume queue processing
 */
export function resume(): void {
  if (!isProcessing && queue.length > 0) {
    startProcessing()
    logger.info('Queue processing resumed')
  }
}

/**
 * Get pending messages for a JID
 */
export function getPendingForJid(jid: string): QueuedMessage[] {
  return queue.filter(m => m.jid === jid)
}

/**
 * Cancel all pending messages for a JID
 */
export function cancelForJid(jid: string): number {
  const before = queue.length
  const remaining = queue.filter(m => m.jid !== jid)
  queue.length = 0
  queue.push(...remaining)
  const removed = before - queue.length
  logger.debug({ jid, removed }, 'Cancelled messages for JID')
  return removed
}

export default {
  enqueue,
  remove,
  clear,
  size,
  getStats,
  pause,
  resume,
  getPendingForJid,
  cancelForJid,
  setSendFunction,
  Priority,
}
