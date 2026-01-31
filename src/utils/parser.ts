import { config } from '../config'
import type { ParsedCommand } from '../types'
import { escapeRegex } from './helpers'

/**
 * Parse a message text to extract command information
 */
export function parseCommand(text: string): ParsedCommand {
  const prefix = config.prefix
  const trimmedText = text.trim()

  // Check if message starts with the prefix
  if (!trimmedText.startsWith(prefix)) {
    return {
      name: '',
      args: [],
      rawArgs: '',
      prefix,
      isCommand: false,
    }
  }

  // Remove prefix and split into parts
  const withoutPrefix = trimmedText.slice(prefix.length).trim()
  const parts = withoutPrefix.split(/\s+/)

  const commandName = (parts[0] || '').toLowerCase()
  const args = parts.slice(1)
  const rawArgs = withoutPrefix.slice(commandName.length).trim()

  return {
    name: commandName,
    args,
    rawArgs,
    prefix,
    isCommand: commandName.length > 0,
  }
}

/**
 * Check if text is a command
 */
export function isCommand(text: string): boolean {
  return text.trim().startsWith(config.prefix)
}

/**
 * Build a regex pattern to match the command prefix
 */
export function getPrefixPattern(): RegExp {
  return new RegExp(`^${escapeRegex(config.prefix)}`, 'i')
}

/**
 * Parse arguments with quotes support
 * @example '!cmd "hello world" foo' -> ['hello world', 'foo']
 */
export function parseQuotedArgs(text: string): string[] {
  const args: string[] = []
  const regex = /"([^"]+)"|'([^']+)'|(\S+)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    args.push(match[1] || match[2] || match[3])
  }

  return args
}

/**
 * Parse flags from arguments
 * @example ['--verbose', '-n', '5', 'text'] -> { flags: { verbose: true, n: '5' }, rest: ['text'] }
 */
export function parseFlags(args: string[]): { flags: Record<string, string | boolean>; rest: string[] } {
  const flags: Record<string, string | boolean> = {}
  const rest: string[] = []
  let i = 0

  while (i < args.length) {
    const arg = args[i]

    if (arg.startsWith('--')) {
      // Long flag: --verbose or --count=5
      const flagPart = arg.slice(2)
      const equalIndex = flagPart.indexOf('=')

      if (equalIndex !== -1) {
        flags[flagPart.slice(0, equalIndex)] = flagPart.slice(equalIndex + 1)
      } else {
        flags[flagPart] = true
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short flag: -v or -n 5
      const flagName = arg.slice(1)
      const nextArg = args[i + 1]

      if (nextArg && !nextArg.startsWith('-')) {
        flags[flagName] = nextArg
        i++
      } else {
        flags[flagName] = true
      }
    } else {
      rest.push(arg)
    }

    i++
  }

  return { flags, rest }
}

export default {
  parseCommand,
  isCommand,
  getPrefixPattern,
  parseQuotedArgs,
  parseFlags,
}
