import type { Command, CommandCategory } from '../types'
import { getAllCommands, getCommand } from '../handlers/commands'
import { config } from '../config'

const categoryEmojis: Record<CommandCategory, string> = {
  general: '📋',
  admin: '👑',
  owner: '🔒',
  utility: '🔧',
  fun: '🎮',
}

const help: Command = {
  name: 'help',
  aliases: ['h', 'menu', 'commands'],
  description: 'Show available commands or get help for a specific command',
  usage: '!help [command]',
  example: '!help ping',
  category: 'general',
  cooldown: 3,

  async execute(ctx) {
    const { args, prefix } = ctx

    // If a specific command is requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase()
      const command = getCommand(commandName)

      if (!command) {
        await ctx.reply(`Command "${commandName}" not found.\nUse ${prefix}help to see all commands.`)
        return
      }

      // Show detailed help for the command
      let helpText = `*Command: ${prefix}${command.name}*\n\n`
      helpText += `📝 ${command.description}\n\n`

      if (command.aliases && command.aliases.length > 0) {
        helpText += `🔀 *Aliases:* ${command.aliases.map(a => prefix + a).join(', ')}\n`
      }

      if (command.usage) {
        helpText += `📖 *Usage:* ${command.usage}\n`
      }

      if (command.example) {
        helpText += `💡 *Example:* ${command.example}\n`
      }

      helpText += `📁 *Category:* ${command.category}\n`

      if (command.cooldown) {
        helpText += `⏱️ *Cooldown:* ${command.cooldown}s\n`
      }

      // Show restrictions
      const restrictions: string[] = []
      if (command.ownerOnly) restrictions.push('Owner only')
      if (command.groupOnly) restrictions.push('Groups only')
      if (command.privateOnly) restrictions.push('Private only')
      if (command.adminOnly) restrictions.push('Admin only')

      if (restrictions.length > 0) {
        helpText += `⚠️ *Restrictions:* ${restrictions.join(', ')}\n`
      }

      await ctx.reply(helpText)
      return
    }

    // Show all commands grouped by category
    const commands = getAllCommands()

    // Filter out owner commands for non-owners
    const visibleCommands = commands.filter(cmd => {
      if (cmd.ownerOnly && !ctx.isOwner) return false
      return true
    })

    // Group commands by category
    const byCategory = new Map<CommandCategory, Command[]>()
    for (const cmd of visibleCommands) {
      const existing = byCategory.get(cmd.category) || []
      existing.push(cmd)
      byCategory.set(cmd.category, existing)
    }

    // Build help message
    let helpText = `*${config.name} Commands*\n`
    helpText += `━━━━━━━━━━━━━━━━━━━━━\n\n`

    // Define category order
    const categoryOrder: CommandCategory[] = ['general', 'utility', 'fun', 'admin', 'owner']

    for (const category of categoryOrder) {
      const cmds = byCategory.get(category)
      if (!cmds || cmds.length === 0) continue

      const emoji = categoryEmojis[category]
      helpText += `${emoji} *${category.charAt(0).toUpperCase() + category.slice(1)}*\n`

      for (const cmd of cmds) {
        helpText += `  ${prefix}${cmd.name} - ${cmd.description}\n`
      }
      helpText += '\n'
    }

    helpText += `━━━━━━━━━━━━━━━━━━━━━\n`
    helpText += `💡 Use ${prefix}help <command> for details\n`
    helpText += `📊 Total commands: ${visibleCommands.length}`

    await ctx.reply(helpText)
  },
}

export default help
