import pino from 'pino'
import path from 'path'
import fs from 'fs'

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const logLevel = process.env.LOG_LEVEL || 'info'

// Create logger with pretty printing for development
export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
})

// Create a child logger for specific modules
export function createLogger(module: string) {
  return logger.child({ module })
}

// Baileys-specific logger (quieter, as Baileys is verbose)
export const baileysLogger = pino({
  level: 'warn',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
})

export default logger
