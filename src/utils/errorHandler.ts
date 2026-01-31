import { createLogger } from './logger'
import type { CommandContext } from '../types'

const logger = createLogger('errorHandler')

/**
 * Error types for categorization
 */
export enum ErrorType {
  COMMAND = 'command',
  CONNECTION = 'connection',
  MESSAGE = 'message',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

/**
 * Custom error class with type
 */
export class BotError extends Error {
  public readonly type: ErrorType
  public readonly originalError?: Error

  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, originalError?: Error) {
    super(message)
    this.name = 'BotError'
    this.type = type
    this.originalError = originalError
  }
}

/**
 * Handle command execution errors
 */
export async function handleCommandError(
  ctx: CommandContext,
  error: Error | unknown
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error))

  logger.error({
    err,
    command: ctx.commandName,
    sender: ctx.sender,
    args: ctx.args,
  }, 'Command execution failed')

  // Send user-friendly error message
  try {
    await ctx.reply('❌ An error occurred while executing this command. Please try again later.')
  } catch (replyError) {
    logger.error({ err: replyError }, 'Failed to send error message to user')
  }
}

/**
 * Handle connection errors
 */
export function handleConnectionError(error: Error | unknown): void {
  const err = error instanceof Error ? error : new Error(String(error))

  logger.error({ err }, 'Connection error')

  // Connection errors are usually handled by the reconnection logic
  // This function is for logging and potential additional handling
}

/**
 * Handle fatal errors (exits the process)
 */
export function handleFatalError(error: Error | unknown): never {
  const err = error instanceof Error ? error : new Error(String(error))

  logger.fatal({ err }, 'Fatal error - shutting down')
  process.exit(1)
}

/**
 * Wrap an async function with error handling
 */
export function wrap<T>(
  fn: () => Promise<T>,
  errorType: ErrorType = ErrorType.UNKNOWN
): Promise<T | undefined> {
  return fn().catch(error => {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error({ err, type: errorType }, 'Wrapped function error')
    return undefined
  })
}

/**
 * Wrap an async function that returns void
 */
export function wrapVoid(
  fn: () => Promise<void>,
  errorType: ErrorType = ErrorType.UNKNOWN
): Promise<void> {
  return fn().catch(error => {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error({ err, type: errorType }, 'Wrapped void function error')
  })
}

/**
 * Create a safe version of a function that catches errors
 */
export function safe<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: ErrorType = ErrorType.UNKNOWN
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error({ err, type: errorType, args }, 'Safe function error')
      return undefined
    }
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.warn({ err: lastError, attempt, maxAttempts }, 'Retry attempt failed')

      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Retry failed')
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught Exception')
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Rejection')
    // Don't exit for unhandled rejections, just log
  })

  logger.info('Global error handlers set up')
}

export default {
  handleCommandError,
  handleConnectionError,
  handleFatalError,
  wrap,
  wrapVoid,
  safe,
  retry,
  setupGlobalErrorHandlers,
  BotError,
  ErrorType,
}
