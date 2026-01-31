import { createLogger } from '../utils/logger'
import { config } from '../config'

const logger = createLogger('rateLimit')

interface RateLimitEntry {
  timestamps: number[]
  blocked: boolean
  blockedUntil: number
}

interface RateLimitConfig {
  limit: number
  window: number // milliseconds
}

// Rate limit configurations
const rateLimitConfigs = {
  perUser: { limit: 5, window: 60000 },      // 5 messages per minute per user
  perGroup: { limit: 10, window: 60000 },    // 10 messages per minute per group
  global: { limit: config.rateLimitPerMinute, window: 60000 }, // configurable global limit
}

// Rate limit storage
const userLimits: Map<string, RateLimitEntry> = new Map()
const groupLimits: Map<string, RateLimitEntry> = new Map()
const globalRequests: number[] = []

// Block duration when rate limit exceeded (5 minutes)
const BLOCK_DURATION = 5 * 60 * 1000

/**
 * Clean old timestamps from an entry
 */
function cleanOldTimestamps(entry: RateLimitEntry, window: number): void {
  const now = Date.now()
  entry.timestamps = entry.timestamps.filter(ts => now - ts < window)
}

/**
 * Get or create a rate limit entry
 */
function getEntry(map: Map<string, RateLimitEntry>, key: string): RateLimitEntry {
  let entry = map.get(key)
  if (!entry) {
    entry = { timestamps: [], blocked: false, blockedUntil: 0 }
    map.set(key, entry)
  }
  return entry
}

/**
 * Check if a request is allowed under a specific limit
 */
function checkLimit(entry: RateLimitEntry, config: RateLimitConfig): boolean {
  const now = Date.now()

  // Check if currently blocked
  if (entry.blocked) {
    if (now < entry.blockedUntil) {
      return false
    }
    // Block expired, reset
    entry.blocked = false
    entry.blockedUntil = 0
    entry.timestamps = []
  }

  // Clean old timestamps
  cleanOldTimestamps(entry, config.window)

  // Check if under limit
  return entry.timestamps.length < config.limit
}

/**
 * Record a request
 */
function recordRequest(entry: RateLimitEntry, config: RateLimitConfig): void {
  const now = Date.now()
  entry.timestamps.push(now)

  // Check if we've exceeded the limit
  cleanOldTimestamps(entry, config.window)
  if (entry.timestamps.length >= config.limit) {
    entry.blocked = true
    entry.blockedUntil = now + BLOCK_DURATION
    logger.warn({ blockedUntil: new Date(entry.blockedUntil) }, 'Rate limit exceeded, blocking')
  }
}

/**
 * Check if sending to a JID is allowed
 */
export function canSend(jid: string, isGroup: boolean): boolean {
  // Check global limit
  const now = Date.now()
  const recentGlobal = globalRequests.filter(ts => now - ts < rateLimitConfigs.global.window)
  if (recentGlobal.length >= rateLimitConfigs.global.limit) {
    logger.debug('Global rate limit reached')
    return false
  }

  // Check per-user or per-group limit
  if (isGroup) {
    const entry = getEntry(groupLimits, jid)
    if (!checkLimit(entry, rateLimitConfigs.perGroup)) {
      logger.debug({ jid }, 'Group rate limit reached')
      return false
    }
  } else {
    const entry = getEntry(userLimits, jid)
    if (!checkLimit(entry, rateLimitConfigs.perUser)) {
      logger.debug({ jid }, 'User rate limit reached')
      return false
    }
  }

  return true
}

/**
 * Record a sent message
 */
export function recordSend(jid: string, isGroup: boolean): void {
  const now = Date.now()

  // Record global
  globalRequests.push(now)
  // Clean old global requests
  const cutoff = now - rateLimitConfigs.global.window
  while (globalRequests.length > 0 && globalRequests[0] < cutoff) {
    globalRequests.shift()
  }

  // Record per-user or per-group
  if (isGroup) {
    const entry = getEntry(groupLimits, jid)
    recordRequest(entry, rateLimitConfigs.perGroup)
  } else {
    const entry = getEntry(userLimits, jid)
    recordRequest(entry, rateLimitConfigs.perUser)
  }

  logger.debug({ jid, isGroup, globalCount: globalRequests.length }, 'Recorded send')
}

/**
 * Get remaining quota for a JID
 */
export function getRemainingQuota(jid: string, isGroup: boolean): number {
  const config = isGroup ? rateLimitConfigs.perGroup : rateLimitConfigs.perUser
  const map = isGroup ? groupLimits : userLimits
  const entry = getEntry(map, jid)

  cleanOldTimestamps(entry, config.window)

  if (entry.blocked) {
    return 0
  }

  return Math.max(0, config.limit - entry.timestamps.length)
}

/**
 * Get time until rate limit resets
 */
export function getResetTime(jid: string, isGroup: boolean): number {
  const config = isGroup ? rateLimitConfigs.perGroup : rateLimitConfigs.perUser
  const map = isGroup ? groupLimits : userLimits
  const entry = getEntry(map, jid)

  if (entry.blocked) {
    return Math.max(0, entry.blockedUntil - Date.now())
  }

  if (entry.timestamps.length === 0) {
    return 0
  }

  const oldestTimestamp = Math.min(...entry.timestamps)
  return Math.max(0, (oldestTimestamp + config.window) - Date.now())
}

/**
 * Check if a JID is currently blocked
 */
export function isBlocked(jid: string, isGroup: boolean): boolean {
  const map = isGroup ? groupLimits : userLimits
  const entry = map.get(jid)

  if (!entry) return false

  if (entry.blocked && Date.now() < entry.blockedUntil) {
    return true
  }

  return false
}

/**
 * Manually unblock a JID
 */
export function unblock(jid: string, isGroup: boolean): void {
  const map = isGroup ? groupLimits : userLimits
  const entry = map.get(jid)

  if (entry) {
    entry.blocked = false
    entry.blockedUntil = 0
    entry.timestamps = []
  }
}

/**
 * Clear all rate limit data
 */
export function clearAll(): void {
  userLimits.clear()
  groupLimits.clear()
  globalRequests.length = 0
  logger.info('Rate limit data cleared')
}

/**
 * Get rate limit statistics
 */
export function getStats(): {
  globalRequests: number
  trackedUsers: number
  trackedGroups: number
  blockedUsers: number
  blockedGroups: number
} {
  let blockedUsers = 0
  let blockedGroups = 0
  const now = Date.now()

  userLimits.forEach(entry => {
    if (entry.blocked && now < entry.blockedUntil) blockedUsers++
  })

  groupLimits.forEach(entry => {
    if (entry.blocked && now < entry.blockedUntil) blockedGroups++
  })

  return {
    globalRequests: globalRequests.length,
    trackedUsers: userLimits.size,
    trackedGroups: groupLimits.size,
    blockedUsers,
    blockedGroups,
  }
}

export default {
  canSend,
  recordSend,
  getRemainingQuota,
  getResetTime,
  isBlocked,
  unblock,
  clearAll,
  getStats,
}
