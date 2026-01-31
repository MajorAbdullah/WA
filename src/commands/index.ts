import type { Command } from '../types'
import { registerCommands } from '../handlers/commands'
import { createLogger } from '../utils/logger'

// Import all commands
import ping from './ping'
import help from './help'
import info from './info'
import uptime from './uptime'
import ban, { unban, banlist } from './ban'
import broadcast from './broadcast'
import reload from './reload'
import stats from './stats'

const logger = createLogger('commands')

// All available commands
const allCommands: Command[] = [
  // General commands
  ping,
  help,
  info,
  uptime,

  // Owner commands
  ban,
  unban,
  banlist,
  broadcast,
  reload,
  stats,
]

/**
 * Load and register all commands
 */
export function loadCommands(): void {
  logger.info({ count: allCommands.length }, 'Loading commands...')
  registerCommands(allCommands)
  logger.info('Commands loaded successfully')
}

/**
 * Get all command definitions
 */
export function getCommandDefinitions(): Command[] {
  return allCommands
}

export default {
  loadCommands,
  getCommandDefinitions,
}
