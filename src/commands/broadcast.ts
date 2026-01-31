import type { Command } from '../types'
import { getAllUsers } from '../services/users'
import { queueMessage, Priority } from '../core/client'
import { numberToJid } from '../utils/helpers'

const broadcast: Command = {
  name: 'broadcast',
  aliases: ['bc', 'announce'],
  description: 'Send a message to all known users',
  usage: '!broadcast <message>',
  example: '!broadcast Bot will be under maintenance at 10 PM',
  category: 'owner',
  ownerOnly: true,
  cooldown: 60, // 1 minute cooldown to prevent spam

  async execute(ctx) {
    const { rawArgs } = ctx

    if (!rawArgs.trim()) {
      await ctx.reply('Please provide a message to broadcast.\n\nUsage: !broadcast <message>')
      return
    }

    const users = getAllUsers()
    const activeUsers = users.filter(u => !u.isBanned && u.messageCount > 0)

    if (activeUsers.length === 0) {
      await ctx.reply('No active users to broadcast to.')
      return
    }

    await ctx.reply(`📢 Broadcasting message to ${activeUsers.length} users...\n\nThis may take a while due to rate limiting.`)

    const message = `📢 *Broadcast Message*\n━━━━━━━━━━━━━━━━━━━━━\n\n${rawArgs}`

    let queued = 0
    for (const user of activeUsers) {
      try {
        const jid = user.jid.includes('@') ? user.jid : numberToJid(user.jid)
        queueMessage(jid, { text: message }, undefined, Priority.LOW)
        queued++
      } catch {
        // Skip invalid JIDs
      }
    }

    await ctx.reply(`✅ Broadcast queued for ${queued} users.\n\nMessages will be sent gradually to avoid rate limits.`)
  },
}

export default broadcast
