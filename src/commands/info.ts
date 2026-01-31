import type { Command } from '../types'
import { getStats } from '../core/client'
import { getCommandCount } from '../handlers/commands'
import { formatUptime } from '../utils/helpers'
import { config } from '../config'

const info: Command = {
  name: 'info',
  aliases: ['status', 'stats', 'botinfo'],
  description: 'Show bot information and statistics',
  usage: '!info',
  category: 'general',
  cooldown: 10,

  async execute(ctx) {
    const stats = getStats()
    const commandCount = getCommandCount()

    let infoText = `*${config.name} Status*\n`
    infoText += `━━━━━━━━━━━━━━━━━━━━━\n\n`

    // Uptime
    infoText += `⏱️ *Uptime:* ${formatUptime(stats.uptime)}\n\n`

    // Statistics
    infoText += `📊 *Statistics*\n`
    infoText += `  📥 Messages received: ${stats.messagesReceived}\n`
    infoText += `  📤 Messages sent: ${stats.messagesSent}\n`
    infoText += `  ⚡ Commands executed: ${stats.commandsExecuted}\n`
    infoText += `  ❌ Errors: ${stats.errors}\n\n`

    // Bot info
    infoText += `🤖 *Bot Info*\n`
    infoText += `  📛 Name: ${config.name}\n`
    infoText += `  🔣 Prefix: ${config.prefix}\n`
    infoText += `  📝 Commands: ${commandCount}\n\n`

    // Configuration
    infoText += `⚙️ *Configuration*\n`
    infoText += `  👥 Groups enabled: ${config.enableGroups ? 'Yes' : 'No'}\n`
    infoText += `  ⌨️ Typing indicator: ${config.enableTypingIndicator ? 'Yes' : 'No'}\n`
    infoText += `  👁️ Auto-read: ${config.enableAutoRead ? 'Yes' : 'No'}\n`

    infoText += `\n━━━━━━━━━━━━━━━━━━━━━\n`
    infoText += `🕐 Started: ${stats.startTime.toLocaleString()}`

    await ctx.reply(infoText)
  },
}

export default info
