import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config()

export interface BotConfig {
  // Bot settings
  prefix: string
  name: string
  ownerNumber: string

  // Connection settings
  usePairingCode: boolean
  phoneNumber: string

  // Anti-ban settings
  rateLimitPerMinute: number
  minResponseDelay: number
  maxResponseDelay: number
  typingSpeed: number

  // Features
  enableGroups: boolean
  enableAutoRead: boolean
  enableTypingIndicator: boolean

  // Paths
  authFolder: string
  logLevel: string
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

export const config: BotConfig = {
  // Bot settings
  prefix: process.env.BOT_PREFIX || '!',
  name: process.env.BOT_NAME || 'WhatsAppBot',
  ownerNumber: process.env.OWNER_NUMBER || '',

  // Connection settings
  usePairingCode: parseBoolean(process.env.USE_PAIRING_CODE, false),
  phoneNumber: process.env.PHONE_NUMBER || '',

  // Anti-ban settings
  rateLimitPerMinute: parseNumber(process.env.RATE_LIMIT_PER_MINUTE, 30),
  minResponseDelay: parseNumber(process.env.MIN_RESPONSE_DELAY_MS, 2000),
  maxResponseDelay: parseNumber(process.env.MAX_RESPONSE_DELAY_MS, 5000),
  typingSpeed: parseNumber(process.env.TYPING_SPEED_MS, 75),

  // Features
  enableGroups: parseBoolean(process.env.ENABLE_GROUPS, true),
  enableAutoRead: parseBoolean(process.env.ENABLE_AUTO_READ, true),
  enableTypingIndicator: parseBoolean(process.env.ENABLE_TYPING_INDICATOR, true),

  // Paths
  authFolder: process.env.AUTH_FOLDER || path.join(process.cwd(), 'data', 'auth'),
  logLevel: process.env.LOG_LEVEL || 'info',
}

// Validate required configuration
export function validateConfig(): void {
  const errors: string[] = []

  if (!config.prefix) {
    errors.push('BOT_PREFIX is required')
  }

  if (config.rateLimitPerMinute < 1) {
    errors.push('RATE_LIMIT_PER_MINUTE must be at least 1')
  }

  if (config.minResponseDelay < 0) {
    errors.push('MIN_RESPONSE_DELAY_MS must be non-negative')
  }

  if (config.maxResponseDelay < config.minResponseDelay) {
    errors.push('MAX_RESPONSE_DELAY_MS must be >= MIN_RESPONSE_DELAY_MS')
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`)
  }
}

export default config
