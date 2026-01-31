// Export all services
export * as rateLimit from './rateLimit'
export * as queue from './queue'
export * as antiSpam from './antiSpam'
export * as presence from './presence'

// Re-export commonly used functions
export { canSend, recordSend, getRemainingQuota } from './rateLimit'
export { enqueue, Priority } from './queue'
export { isDuplicate, recordMessage, addVariation } from './antiSpam'
export { simulateTyping, showTyping, hideTyping } from './presence'
