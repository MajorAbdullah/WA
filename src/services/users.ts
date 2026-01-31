import { createLogger } from '../utils/logger'
import { jidToNumber } from '../utils/helpers'

const logger = createLogger('users')

export interface UserData {
  jid: string
  name?: string
  isBanned: boolean
  isOwner: boolean
  firstSeen: Date
  lastSeen: Date
  messageCount: number
  commandCount: number
  warnings: number
}

// In-memory user storage
const users: Map<string, UserData> = new Map()

// Banned users set (for quick lookup)
const bannedUsers: Set<string> = new Set()

/**
 * Get or create user data
 */
export function getUser(jid: string): UserData {
  const normalized = jidToNumber(jid)
  let user = users.get(normalized)

  if (!user) {
    user = {
      jid,
      isBanned: bannedUsers.has(normalized),
      isOwner: false,
      firstSeen: new Date(),
      lastSeen: new Date(),
      messageCount: 0,
      commandCount: 0,
      warnings: 0,
    }
    users.set(normalized, user)
  }

  return user
}

/**
 * Update user data
 */
export function updateUser(jid: string, data: Partial<UserData>): UserData {
  const user = getUser(jid)
  Object.assign(user, data, { lastSeen: new Date() })
  return user
}

/**
 * Record a message from a user
 */
export function recordMessage(jid: string, name?: string): UserData {
  const user = getUser(jid)
  user.messageCount++
  user.lastSeen = new Date()
  if (name) user.name = name
  return user
}

/**
 * Record a command execution from a user
 */
export function recordCommand(jid: string): UserData {
  const user = getUser(jid)
  user.commandCount++
  user.lastSeen = new Date()
  return user
}

/**
 * Ban a user
 */
export function banUser(jid: string, reason?: string): boolean {
  const normalized = jidToNumber(jid)
  const user = getUser(jid)

  if (user.isBanned) {
    return false // Already banned
  }

  user.isBanned = true
  bannedUsers.add(normalized)
  logger.info({ jid: normalized, reason }, 'User banned')
  return true
}

/**
 * Unban a user
 */
export function unbanUser(jid: string): boolean {
  const normalized = jidToNumber(jid)
  const user = users.get(normalized)

  if (!user || !user.isBanned) {
    bannedUsers.delete(normalized)
    return false // Not banned
  }

  user.isBanned = false
  bannedUsers.delete(normalized)
  logger.info({ jid: normalized }, 'User unbanned')
  return true
}

/**
 * Check if a user is banned
 */
export function isBanned(jid: string): boolean {
  const normalized = jidToNumber(jid)
  return bannedUsers.has(normalized)
}

/**
 * Add a warning to a user
 */
export function warnUser(jid: string): number {
  const user = getUser(jid)
  user.warnings++
  logger.info({ jid: jidToNumber(jid), warnings: user.warnings }, 'User warned')
  return user.warnings
}

/**
 * Clear warnings for a user
 */
export function clearWarnings(jid: string): void {
  const user = getUser(jid)
  user.warnings = 0
}

/**
 * Get all users
 */
export function getAllUsers(): UserData[] {
  return Array.from(users.values())
}

/**
 * Get all banned users
 */
export function getBannedUsers(): UserData[] {
  return getAllUsers().filter(user => user.isBanned)
}

/**
 * Get user count
 */
export function getUserCount(): number {
  return users.size
}

/**
 * Get banned user count
 */
export function getBannedCount(): number {
  return bannedUsers.size
}

/**
 * Check if user exists
 */
export function hasUser(jid: string): boolean {
  return users.has(jidToNumber(jid))
}

/**
 * Delete user data
 */
export function deleteUser(jid: string): boolean {
  const normalized = jidToNumber(jid)
  bannedUsers.delete(normalized)
  return users.delete(normalized)
}

/**
 * Clear all user data
 */
export function clearAllUsers(): void {
  users.clear()
  bannedUsers.clear()
  logger.info('All user data cleared')
}

/**
 * Get user statistics
 */
export function getStats(): {
  totalUsers: number
  bannedUsers: number
  totalMessages: number
  totalCommands: number
} {
  let totalMessages = 0
  let totalCommands = 0

  for (const user of users.values()) {
    totalMessages += user.messageCount
    totalCommands += user.commandCount
  }

  return {
    totalUsers: users.size,
    bannedUsers: bannedUsers.size,
    totalMessages,
    totalCommands,
  }
}

export default {
  getUser,
  updateUser,
  recordMessage,
  recordCommand,
  banUser,
  unbanUser,
  isBanned,
  warnUser,
  clearWarnings,
  getAllUsers,
  getBannedUsers,
  getUserCount,
  getBannedCount,
  hasUser,
  deleteUser,
  clearAllUsers,
  getStats,
}
