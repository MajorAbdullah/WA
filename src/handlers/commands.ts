import type { Command, CommandCategory } from '../types'
import { createLogger } from '../utils/logger'

const logger = createLogger('commands')

// Command registry
const commands: Map<string, Command> = new Map()
const aliases: Map<string, string> = new Map()

/**
 * Register a command
 */
export function registerCommand(command: Command): void {
  // Register main command name
  commands.set(command.name.toLowerCase(), command)
  logger.debug({ name: command.name }, 'Command registered')

  // Register aliases
  if (command.aliases) {
    for (const alias of command.aliases) {
      aliases.set(alias.toLowerCase(), command.name.toLowerCase())
      logger.debug({ alias, command: command.name }, 'Alias registered')
    }
  }
}

/**
 * Register multiple commands at once
 */
export function registerCommands(cmds: Command[]): void {
  for (const cmd of cmds) {
    registerCommand(cmd)
  }
}

/**
 * Get a command by name or alias
 */
export function getCommand(nameOrAlias: string): Command | undefined {
  const normalized = nameOrAlias.toLowerCase()

  // Try direct command lookup
  let command = commands.get(normalized)
  if (command) return command

  // Try alias lookup
  const commandName = aliases.get(normalized)
  if (commandName) {
    command = commands.get(commandName)
  }

  return command
}

/**
 * Check if a command exists
 */
export function hasCommand(nameOrAlias: string): boolean {
  return getCommand(nameOrAlias) !== undefined
}

/**
 * Get all registered commands
 */
export function getAllCommands(): Command[] {
  return Array.from(commands.values())
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: CommandCategory): Command[] {
  return getAllCommands().filter(cmd => cmd.category === category)
}

/**
 * Get command names (without aliases)
 */
export function getCommandNames(): string[] {
  return Array.from(commands.keys())
}

/**
 * Unregister a command
 */
export function unregisterCommand(name: string): boolean {
  const command = commands.get(name.toLowerCase())
  if (!command) return false

  // Remove main command
  commands.delete(name.toLowerCase())

  // Remove aliases
  if (command.aliases) {
    for (const alias of command.aliases) {
      aliases.delete(alias.toLowerCase())
    }
  }

  logger.debug({ name }, 'Command unregistered')
  return true
}

/**
 * Clear all registered commands
 */
export function clearCommands(): void {
  commands.clear()
  aliases.clear()
  logger.debug('All commands cleared')
}

/**
 * Get command count
 */
export function getCommandCount(): number {
  return commands.size
}

export default {
  registerCommand,
  registerCommands,
  getCommand,
  hasCommand,
  getAllCommands,
  getCommandsByCategory,
  getCommandNames,
  unregisterCommand,
  clearCommands,
  getCommandCount,
}
