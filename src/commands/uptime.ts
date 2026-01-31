import type { Command } from '../types'
import { getStats } from '../core/client'
import { formatUptime } from '../utils/helpers'

const uptime: Command = {
  name: 'uptime',
  aliases: ['up', 'runtime'],
  description: 'Show how long the bot has been running',
  usage: '!uptime',
  category: 'general',
  cooldown: 5,

  async execute(ctx) {
    const stats = getStats()
    const uptimeStr = formatUptime(stats.uptime)

    await ctx.reply(`🕐 *Bot Uptime*\n\n${uptimeStr}\n\n📅 Started: ${stats.startTime.toLocaleString()}`)
  },
}

export default uptime
