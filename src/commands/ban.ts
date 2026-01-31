import type { Command } from '../types'
import { banUser, unbanUser, isBanned, getBannedUsers } from '../services/users'
import { numberToJid, jidToNumber } from '../utils/helpers'

const ban: Command = {
  name: 'ban',
  aliases: ['block'],
  description: 'Ban a user from using the bot',
  usage: '!ban <number>',
  example: '!ban 1234567890',
  category: 'owner',
  ownerOnly: true,
  cooldown: 3,

  async execute(ctx) {
    const { args } = ctx

    if (args.length === 0) {
      await ctx.reply('Please provide a phone number to ban.\n\nUsage: !ban <number>')
      return
    }

    const number = args[0].replace(/[^\d]/g, '')
    if (!number) {
      await ctx.reply('Invalid phone number. Please provide a valid number.')
      return
    }

    const jid = numberToJid(number)

    if (isBanned(jid)) {
      await ctx.reply(`User ${number} is already banned.`)
      return
    }

    const success = banUser(jid)
    if (success) {
      await ctx.reply(`✅ User ${number} has been banned from using the bot.`)
    } else {
      await ctx.reply(`Failed to ban user ${number}.`)
    }
  },
}

export const unban: Command = {
  name: 'unban',
  aliases: ['unblock'],
  description: 'Unban a user',
  usage: '!unban <number>',
  example: '!unban 1234567890',
  category: 'owner',
  ownerOnly: true,
  cooldown: 3,

  async execute(ctx) {
    const { args } = ctx

    if (args.length === 0) {
      await ctx.reply('Please provide a phone number to unban.\n\nUsage: !unban <number>')
      return
    }

    const number = args[0].replace(/[^\d]/g, '')
    if (!number) {
      await ctx.reply('Invalid phone number. Please provide a valid number.')
      return
    }

    const jid = numberToJid(number)

    if (!isBanned(jid)) {
      await ctx.reply(`User ${number} is not banned.`)
      return
    }

    const success = unbanUser(jid)
    if (success) {
      await ctx.reply(`✅ User ${number} has been unbanned.`)
    } else {
      await ctx.reply(`Failed to unban user ${number}.`)
    }
  },
}

export const banlist: Command = {
  name: 'banlist',
  aliases: ['banned', 'bans'],
  description: 'Show list of banned users',
  usage: '!banlist',
  category: 'owner',
  ownerOnly: true,
  cooldown: 5,

  async execute(ctx) {
    const banned = getBannedUsers()

    if (banned.length === 0) {
      await ctx.reply('No users are currently banned.')
      return
    }

    let text = `*Banned Users (${banned.length})*\n━━━━━━━━━━━━━━━━━━━━━\n\n`

    for (const user of banned) {
      const number = jidToNumber(user.jid)
      const name = user.name || 'Unknown'
      text += `• ${number} (${name})\n`
    }

    await ctx.reply(text)
  },
}

export default ban
