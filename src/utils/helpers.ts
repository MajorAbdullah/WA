import type { WAMessage } from '@whiskeysockets/baileys'

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate a random delay between min and max milliseconds
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min))
}

/**
 * Sleep for a random duration between min and max milliseconds
 */
export async function randomSleep(min: number, max: number): Promise<void> {
  await sleep(randomDelay(min, max))
}

/**
 * Extract the phone number from a JID
 * @example '1234567890@s.whatsapp.net' -> '1234567890'
 */
export function jidToNumber(jid: string): string {
  return jid.replace(/@.*$/, '')
}

/**
 * Convert a phone number to a WhatsApp JID
 * @example '1234567890' -> '1234567890@s.whatsapp.net'
 */
export function numberToJid(number: string): string {
  // Remove any non-numeric characters except +
  const cleaned = number.replace(/[^\d]/g, '')
  return `${cleaned}@s.whatsapp.net`
}

/**
 * Check if a JID is a group
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us')
}

/**
 * Check if a JID is a broadcast list
 */
export function isBroadcastJid(jid: string): boolean {
  return jid.endsWith('@broadcast')
}

/**
 * Extract message content from a WAMessage
 */
export function extractMessageContent(message: WAMessage): string | null {
  const msg = message.message
  if (!msg) return null

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    null
  )
}

/**
 * Get the sender JID from a message
 */
export function getSenderJid(message: WAMessage): string {
  return message.key.participant || message.key.remoteJid || ''
}

/**
 * Get the chat JID (group or private) from a message
 */
export function getChatJid(message: WAMessage): string {
  return message.key.remoteJid || ''
}

/**
 * Check if the message is from the bot itself
 */
export function isFromMe(message: WAMessage): boolean {
  return message.key.fromMe === true
}

/**
 * Format uptime from milliseconds to human readable string
 */
export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const parts: string[] = []

  if (days > 0) parts.push(`${days}d`)
  if (hours % 24 > 0) parts.push(`${hours % 24}h`)
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
  if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`)

  return parts.join(' ')
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

/**
 * Escape special characters for use in regex
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Parse mentions from message text
 * @example '@1234567890 hello' -> ['1234567890@s.whatsapp.net']
 */
export function parseMentions(text: string): string[] {
  const mentionRegex = /@(\d+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(`${match[1]}@s.whatsapp.net`)
  }

  return mentions
}
