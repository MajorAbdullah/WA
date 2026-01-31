import type { Command } from '../types'
import { getExtendedStats } from '../core/client'
import { getStats as getUserStats } from '../services/users'
import { formatUptime } from '../utils/helpers'

const stats: Command = {
  name: 'stats',
  aliases: ['statistics', 'metrics'],
  description: 'Show detailed bot statistics',
  usage: '!stats',
  category: 'owner',
  ownerOnly: true,
  cooldown: 10,

  async execute(ctx) {
    const extended = getExtendedStats()
    const userStats = getUserStats()
    const { bot, rateLimit, queue, antiSpam } = extended

    let text = `📊 *Bot Statistics*\n`
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`

    // Uptime
    text += `⏱️ *Runtime*\n`
    text += `  Uptime: ${formatUptime(bot.uptime)}\n\n`

    // Message stats
    text += `📨 *Messages*\n`
    text += `  Received: ${bot.messagesReceived}\n`
    text += `  Sent: ${bot.messagesSent}\n`
    text += `  Commands: ${bot.commandsExecuted}\n`
    text += `  Errors: ${bot.errors}\n\n`

    // User stats
    text += `👥 *Users*\n`
    text += `  Total: ${userStats.totalUsers}\n`
    text += `  Banned: ${userStats.bannedUsers}\n`
    text += `  Total messages: ${userStats.totalMessages}\n`
    text += `  Total commands: ${userStats.totalCommands}\n\n`

    // Rate limit stats
    text += `🚦 *Rate Limiting*\n`
    text += `  Global requests: ${rateLimit.globalRequests}\n`
    text += `  Tracked users: ${rateLimit.trackedUsers}\n`
    text += `  Tracked groups: ${rateLimit.trackedGroups}\n`
    text += `  Blocked users: ${rateLimit.blockedUsers}\n`
    text += `  Blocked groups: ${rateLimit.blockedGroups}\n\n`

    // Queue stats
    text += `📬 *Message Queue*\n`
    text += `  Size: ${queue.size}\n`
    text += `  Processing: ${queue.isProcessing ? 'Yes' : 'No'}\n`
    text += `  Urgent: ${queue.byPriority.urgent}\n`
    text += `  High: ${queue.byPriority.high}\n`
    text += `  Normal: ${queue.byPriority.normal}\n`
    text += `  Low: ${queue.byPriority.low}\n\n`

    // Anti-spam stats
    text += `🛡️ *Anti-Spam*\n`
    text += `  Tracked JIDs: ${antiSpam.trackedJids}\n`
    text += `  Message hashes: ${antiSpam.totalHashes}\n`
    text += `  Recent texts: ${antiSpam.totalTexts}\n`

    await ctx.reply(text)
  },
}

export default stats
