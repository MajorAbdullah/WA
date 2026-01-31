import type { WAMessage, WASocket, AnyMessageContent } from '@whiskeysockets/baileys'
import type { CommandContext, Command } from '../types'
import { config } from '../config'
import { createLogger } from '../utils/logger'
import { parseCommand } from '../utils/parser'
import { getCommand } from './commands'
import {
  extractMessageContent,
  getSenderJid,
  getChatJid,
  isFromMe,
  isGroupJid,
  jidToNumber,
} from '../utils/helpers'
import {
  sendMessage,
  sendReply,
  sendReaction,
  markAsRead,
  incrementStat,
  getSocket,
} from '../core/client'
import { isBanned, recordMessage as recordUserMessage, recordCommand as recordUserCommand } from '../services/users'

const logger = createLogger('message')

// Cooldown tracking
const cooldowns: Map<string, Map<string, number>> = new Map()

/**
 * Get the sender's push name (display name)
 */
function getSenderName(message: WAMessage): string {
  return message.pushName || 'Unknown'
}

/**
 * Check if sender is the bot owner
 */
function isOwner(senderNumber: string): boolean {
  if (!config.ownerNumber) return false
  return senderNumber === config.ownerNumber.replace(/[^\d]/g, '')
}

/**
 * Check if sender is a group admin
 */
async function isGroupAdmin(socket: WASocket, groupJid: string, senderJid: string): Promise<boolean> {
  try {
    const metadata = await socket.groupMetadata(groupJid)
    const participant = metadata.participants.find(p => p.id === senderJid)
    return participant?.admin === 'admin' || participant?.admin === 'superadmin'
  } catch {
    return false
  }
}

/**
 * Get group name
 */
async function getGroupName(socket: WASocket, groupJid: string): Promise<string | null> {
  try {
    const metadata = await socket.groupMetadata(groupJid)
    return metadata.subject
  } catch {
    return null
  }
}

/**
 * Check command cooldown
 */
function checkCooldown(command: Command, senderJid: string): { allowed: boolean; remaining: number } {
  if (!command.cooldown || command.cooldown <= 0) {
    return { allowed: true, remaining: 0 }
  }

  const commandCooldowns = cooldowns.get(command.name) || new Map()
  const lastUsed = commandCooldowns.get(senderJid) || 0
  const now = Date.now()
  const cooldownMs = command.cooldown * 1000
  const timePassed = now - lastUsed

  if (timePassed < cooldownMs) {
    return {
      allowed: false,
      remaining: Math.ceil((cooldownMs - timePassed) / 1000),
    }
  }

  // Update cooldown
  commandCooldowns.set(senderJid, now)
  cooldowns.set(command.name, commandCooldowns)

  return { allowed: true, remaining: 0 }
}

/**
 * Create command context for a message
 */
async function createContext(
  message: WAMessage,
  command: Command,
  args: string[],
  rawArgs: string
): Promise<CommandContext> {
  const socket = getSocket()
  if (!socket) {
    throw new Error('Socket not connected')
  }

  const chatJid = getChatJid(message)
  const senderJid = getSenderJid(message)
  const senderNumber = jidToNumber(senderJid)
  const isGroup = isGroupJid(chatJid)

  let groupName: string | null = null
  let senderIsAdmin = false

  if (isGroup) {
    groupName = await getGroupName(socket, chatJid)
    senderIsAdmin = await isGroupAdmin(socket, chatJid, senderJid)
  }

  const ctx: CommandContext = {
    socket,
    message,
    sender: senderJid,
    senderName: getSenderName(message),
    senderNumber,
    isGroup,
    groupId: isGroup ? chatJid : null,
    groupName,
    isOwner: isOwner(senderNumber),
    isGroupAdmin: senderIsAdmin,
    args,
    rawArgs,
    prefix: config.prefix,
    commandName: command.name,

    // Helper methods
    reply: async (text: string) => {
      await sendReply(chatJid, text, message)
    },

    react: async (emoji: string) => {
      await sendReaction(chatJid, emoji, message.key)
    },

    sendMessage: async (content: AnyMessageContent) => {
      await sendMessage(chatJid, content)
    },
  }

  return ctx
}

/**
 * Handle an incoming message
 */
export async function handleMessage(message: WAMessage): Promise<void> {
  // Skip messages from self (unless testing)
  if (isFromMe(message)) {
    return
  }

  // Increment stats
  incrementStat('messagesReceived')

  const chatJid = getChatJid(message)
  const senderJid = getSenderJid(message)
  const senderName = getSenderName(message)
  const senderNumber = jidToNumber(senderJid)
  const isGroup = isGroupJid(chatJid)

  // Check if user is banned (skip owner)
  if (isBanned(senderJid) && !isOwner(senderNumber)) {
    logger.debug({ jid: senderJid }, 'Ignoring message from banned user')
    return
  }

  // Skip group messages if groups are disabled
  if (isGroup && !config.enableGroups) {
    return
  }

  // Extract message text
  const text = extractMessageContent(message)
  if (!text) {
    return
  }

  // Record user activity
  recordUserMessage(senderJid, senderName)

  // Mark message as read
  await markAsRead(chatJid, [message.key])

  // Parse command
  const parsed = parseCommand(text)

  // Log received message
  logger.info({
    from: senderName,
    jid: senderJid,
    isGroup,
    text: text.substring(0, 100),
    isCommand: parsed.isCommand,
  }, 'Message received')

  // Handle commands
  if (parsed.isCommand) {
    await handleCommand(message, parsed.name, parsed.args, parsed.rawArgs)
  }
}

/**
 * Handle a command
 */
async function handleCommand(
  message: WAMessage,
  commandName: string,
  args: string[],
  rawArgs: string
): Promise<void> {
  const chatJid = getChatJid(message)
  const senderJid = getSenderJid(message)
  const senderNumber = jidToNumber(senderJid)
  const isGroup = isGroupJid(chatJid)

  // Find command
  const command = getCommand(commandName)
  if (!command) {
    logger.debug({ command: commandName }, 'Unknown command')
    return
  }

  logger.info({
    command: command.name,
    sender: senderJid,
    args,
  }, 'Executing command')

  try {
    // Check owner-only restriction
    if (command.ownerOnly && !isOwner(senderNumber)) {
      await sendReply(chatJid, 'This command is only available to the bot owner.', message)
      return
    }

    // Check group-only restriction
    if (command.groupOnly && !isGroup) {
      await sendReply(chatJid, 'This command can only be used in groups.', message)
      return
    }

    // Check private-only restriction
    if (command.privateOnly && isGroup) {
      await sendReply(chatJid, 'This command can only be used in private chats.', message)
      return
    }

    // Check admin-only restriction
    if (command.adminOnly && isGroup) {
      const socket = getSocket()
      if (socket) {
        const isAdmin = await isGroupAdmin(socket, chatJid, senderJid)
        if (!isAdmin && !isOwner(senderNumber)) {
          await sendReply(chatJid, 'This command requires admin privileges.', message)
          return
        }
      }
    }

    // Check cooldown
    const cooldownCheck = checkCooldown(command, senderJid)
    if (!cooldownCheck.allowed) {
      await sendReply(
        chatJid,
        `Please wait ${cooldownCheck.remaining} seconds before using this command again.`,
        message
      )
      return
    }

    // Create context and execute command
    const ctx = await createContext(message, command, args, rawArgs)
    await command.execute(ctx)

    // Update stats
    incrementStat('commandsExecuted')
    recordUserCommand(senderJid)

    logger.info({ command: command.name }, 'Command executed successfully')
  } catch (error) {
    incrementStat('errors')
    logger.error({ err: error, command: command.name }, 'Command execution failed')

    // Send error message to user
    await sendReply(chatJid, 'An error occurred while executing this command.', message)
  }
}

/**
 * Handle messages.upsert event from Baileys
 */
export function handleMessagesUpsert(upsert: { messages: WAMessage[]; type: string }): void {
  const { messages, type } = upsert

  // Only process new messages (not history sync)
  if (type !== 'notify') return

  for (const message of messages) {
    handleMessage(message).catch(error => {
      logger.error({ err: error }, 'Failed to handle message')
    })
  }
}

export default {
  handleMessage,
  handleMessagesUpsert,
}
