import type { Command } from '../types'

const ping: Command = {
  name: 'ping',
  aliases: ['p', 'latency'],
  description: 'Check bot latency and response time',
  usage: '!ping',
  category: 'general',
  cooldown: 5,

  async execute(ctx) {
    const start = Date.now()
    await ctx.react('🏓')
    const latency = Date.now() - start

    await ctx.reply(`Pong! 🏓\nLatency: ${latency}ms`)
  },
}

export default ping
