import { createLogger } from '../utils/logger'
import crypto from 'crypto'

const logger = createLogger('antiSpam')

// Configuration
const DUPLICATE_WINDOW = 60000 // 1 minute window for duplicate detection
const MAX_HISTORY_SIZE = 100 // Max messages to track per JID
const SIMILARITY_THRESHOLD = 0.85 // 85% similarity threshold

// Message history storage
interface MessageHistory {
  hashes: Map<string, number> // hash -> timestamp
  recentTexts: { text: string; timestamp: number }[]
}

const messageHistory: Map<string, MessageHistory> = new Map()

/**
 * Create a hash of message content
 */
function hashContent(content: string): string {
  return crypto.createHash('md5').update(content.toLowerCase().trim()).digest('hex')
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0

  const len1 = s1.length
  const len2 = s2.length

  // Create distance matrix
  const matrix: number[][] = []
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)
  return 1 - distance / maxLen
}

/**
 * Get or create message history for a JID
 */
function getHistory(jid: string): MessageHistory {
  let history = messageHistory.get(jid)
  if (!history) {
    history = {
      hashes: new Map(),
      recentTexts: [],
    }
    messageHistory.set(jid, history)
  }
  return history
}

/**
 * Clean old entries from history
 */
function cleanHistory(history: MessageHistory): void {
  const now = Date.now()
  const cutoff = now - DUPLICATE_WINDOW

  // Clean old hashes
  for (const [hash, timestamp] of history.hashes) {
    if (timestamp < cutoff) {
      history.hashes.delete(hash)
    }
  }

  // Clean old texts
  history.recentTexts = history.recentTexts.filter(
    entry => entry.timestamp >= cutoff
  )

  // Trim to max size
  if (history.recentTexts.length > MAX_HISTORY_SIZE) {
    history.recentTexts = history.recentTexts.slice(-MAX_HISTORY_SIZE)
  }
}

/**
 * Check if a message is a duplicate (exact match)
 */
export function isExactDuplicate(jid: string, content: string): boolean {
  const history = getHistory(jid)
  cleanHistory(history)

  const hash = hashContent(content)
  return history.hashes.has(hash)
}

/**
 * Check if a message is similar to recent messages
 */
export function isSimilarToRecent(jid: string, content: string): boolean {
  const history = getHistory(jid)
  cleanHistory(history)

  const normalizedContent = content.toLowerCase().trim()

  for (const entry of history.recentTexts) {
    const similarity = calculateSimilarity(normalizedContent, entry.text)
    if (similarity >= SIMILARITY_THRESHOLD) {
      logger.debug({ jid, similarity: similarity.toFixed(2) }, 'Similar message detected')
      return true
    }
  }

  return false
}

/**
 * Check if a message is a duplicate (exact or similar)
 */
export function isDuplicate(jid: string, content: string): boolean {
  return isExactDuplicate(jid, content) || isSimilarToRecent(jid, content)
}

/**
 * Record a message in history
 */
export function recordMessage(jid: string, content: string): void {
  const history = getHistory(jid)
  const now = Date.now()

  // Record hash
  const hash = hashContent(content)
  history.hashes.set(hash, now)

  // Record text
  history.recentTexts.push({
    text: content.toLowerCase().trim(),
    timestamp: now,
  })

  cleanHistory(history)
  logger.debug({ jid, historySize: history.recentTexts.length }, 'Message recorded')
}

/**
 * Add variation to text to avoid detection
 * Uses zero-width characters and slight variations
 */
export function addVariation(text: string): string {
  // Zero-width characters
  const zeroWidthChars = [
    '\u200B', // Zero-width space
    '\u200C', // Zero-width non-joiner
    '\u200D', // Zero-width joiner
    '\uFEFF', // Zero-width no-break space
  ]

  // Randomly insert a zero-width character
  const randomIndex = Math.floor(Math.random() * (text.length + 1))
  const randomChar = zeroWidthChars[Math.floor(Math.random() * zeroWidthChars.length)]

  return text.slice(0, randomIndex) + randomChar + text.slice(randomIndex)
}

/**
 * Clear history for a specific JID
 */
export function clearHistory(jid: string): void {
  messageHistory.delete(jid)
  logger.debug({ jid }, 'History cleared for JID')
}

/**
 * Clear all message history
 */
export function clearAllHistory(): void {
  messageHistory.clear()
  logger.info('All message history cleared')
}

/**
 * Get statistics
 */
export function getStats(): {
  trackedJids: number
  totalHashes: number
  totalTexts: number
} {
  let totalHashes = 0
  let totalTexts = 0

  for (const history of messageHistory.values()) {
    totalHashes += history.hashes.size
    totalTexts += history.recentTexts.length
  }

  return {
    trackedJids: messageHistory.size,
    totalHashes,
    totalTexts,
  }
}

export default {
  isExactDuplicate,
  isSimilarToRecent,
  isDuplicate,
  recordMessage,
  addVariation,
  clearHistory,
  clearAllHistory,
  getStats,
}
