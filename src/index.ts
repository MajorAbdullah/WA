import { config, validateConfig } from './config'
import { logger } from './utils/logger'
import {
  startBot,
  stopBot,
  setConnectionCallback,
  setMessageCallback,
} from './core/client'
import { loadCommands } from './commands'
import { handleMessagesUpsert } from './handlers/message'

async function main() {
  logger.info('==================================================')
  logger.info(`Starting ${config.name}...`)
  logger.info('==================================================')

  // Validate configuration
  try {
    validateConfig()
    logger.info('Configuration validated successfully')
  } catch (error) {
    logger.error({ err: error }, 'Configuration validation failed')
    process.exit(1)
  }

  // Log current configuration
  logger.info({
    prefix: config.prefix,
    name: config.name,
    rateLimitPerMinute: config.rateLimitPerMinute,
    enableGroups: config.enableGroups,
  }, 'Bot configuration')

  // Load commands
  loadCommands()

  // Set up connection state callback
  setConnectionCallback((update) => {
    const { connection, qr } = update

    if (qr) {
      logger.info('Scan the QR code above with WhatsApp to connect')
    }

    if (connection === 'open') {
      logger.info('Bot is now online and ready!')
    }
  })

  // Set up message handler
  setMessageCallback(handleMessagesUpsert)

  // Start the bot
  try {
    await startBot()
    logger.info('Bot started - waiting for QR code scan or session restore...')
  } catch (error) {
    logger.error({ err: error }, 'Failed to start bot')
    process.exit(1)
  }
}

// Graceful shutdown handlers
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`)
  await stopBot()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught Exception')
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection')
  process.exit(1)
})

// Run the bot
main().catch((error) => {
  logger.error({ err: error }, 'Fatal error')
  process.exit(1)
})
