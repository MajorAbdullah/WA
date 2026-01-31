import type { Command } from '../types'
import { clearCommands, getCommandCount } from '../handlers/commands'
import { loadCommands } from './index'

const reload: Command = {
  name: 'reload',
  aliases: ['rl'],
  description: 'Reload all bot commands',
  usage: '!reload',
  category: 'owner',
  ownerOnly: true,
  cooldown: 10,

  async execute(ctx) {
    await ctx.react('🔄')

    try {
      const beforeCount = getCommandCount()

      // Clear existing commands
      clearCommands()

      // Reload commands
      loadCommands()

      const afterCount = getCommandCount()

      await ctx.reply(`✅ Commands reloaded successfully!\n\nBefore: ${beforeCount} commands\nAfter: ${afterCount} commands`)
    } catch (error) {
      await ctx.reply(`❌ Failed to reload commands: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
}

export default reload
