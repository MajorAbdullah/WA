import makeWASocket, {
  DisconnectReason,
  WASocket,
  ConnectionState,
  Browsers,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode-terminal'
import { createLogger, baileysLogger } from '../utils/logger'
import { initSession, SessionState } from './session'
import { config } from '../config'

const logger = createLogger('connection')

// Pairing code state
let pairingCodeRequested = false

// Reconnection configuration
const RECONNECT_INTERVALS = [1000, 2000, 5000, 10000, 30000, 60000] // Exponential backoff
const MAX_RECONNECT_ATTEMPTS = 10

// Connection state
let socket: WASocket | null = null
let sessionState: SessionState | null = null
let reconnectAttempts = 0
let isIntentionalDisconnect = false

// Event callbacks
type ConnectionCallback = (state: Partial<ConnectionState>) => void
type MessageCallback = (messages: any) => void

let onConnectionUpdate: ConnectionCallback | null = null
let onMessagesUpsert: MessageCallback | null = null

/**
 * Set callback for connection state changes
 */
export function setConnectionCallback(callback: ConnectionCallback): void {
  onConnectionUpdate = callback
}

/**
 * Set callback for incoming messages
 */
export function setMessageCallback(callback: MessageCallback): void {
  onMessagesUpsert = callback
}

/**
 * Get the current socket instance
 */
export function getSocket(): WASocket | null {
  return socket
}

/**
 * Check if the socket is connected
 */
export function isConnected(): boolean {
  return socket?.user !== undefined
}

/**
 * Calculate reconnection delay using exponential backoff
 */
function getReconnectDelay(): number {
  const index = Math.min(reconnectAttempts, RECONNECT_INTERVALS.length - 1)
  return RECONNECT_INTERVALS[index]
}

/**
 * Create and configure the Baileys socket
 */
async function createSocket(): Promise<WASocket> {
  if (!sessionState) {
    sessionState = await initSession()
  }

  const sock = makeWASocket({
    auth: sessionState.state,
    browser: Browsers.ubuntu('Chrome'),
    logger: baileysLogger,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    // Disable QR print when using pairing code
    printQRInTerminal: !config.usePairingCode,
  })

  return sock
}

/**
 * Request pairing code for phone number authentication
 */
async function requestPairingCode(sock: WASocket): Promise<void> {
  if (pairingCodeRequested) return

  const phoneNumber = config.phoneNumber.replace(/[^0-9]/g, '') // Remove non-numeric chars

  if (!phoneNumber) {
    logger.error('PHONE_NUMBER is required when USE_PAIRING_CODE=true')
    logger.info('Set PHONE_NUMBER in .env (e.g., PHONE_NUMBER=923314378123)')
    return
  }

  try {
    pairingCodeRequested = true
    const code = await sock.requestPairingCode(phoneNumber)
    logger.info({ code }, '========================================')
    logger.info({ code }, `PAIRING CODE: ${code}`)
    logger.info({ code }, '========================================')
    logger.info('Enter this code in WhatsApp: Settings > Linked Devices > Link a Device > Link with phone number')
  } catch (error) {
    pairingCodeRequested = false
    logger.error({ err: error }, 'Failed to request pairing code')
  }
}

/**
 * Handle connection state updates
 */
function handleConnectionUpdate(update: Partial<ConnectionState>): void {
  const { connection, lastDisconnect, qr } = update

  // Handle pairing code mode - request code when QR would be shown
  if (qr && config.usePairingCode && socket && !socket.authState.creds.registered && !pairingCodeRequested) {
    // Small delay to ensure socket is ready
    setTimeout(() => {
      if (socket) requestPairingCode(socket)
    }, 1000)
  }

  // Display QR code in terminal (only if not using pairing code)
  if (qr && !config.usePairingCode) {
    logger.info('QR Code generated - scan with WhatsApp to authenticate')
    console.log('\n') // Add spacing
    qrcode.generate(qr, { small: true })
    console.log('\n')
  }

  // Handle connection state changes
  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
    const reason = DisconnectReason[statusCode] || 'Unknown'

    logger.warn({ statusCode, reason }, 'Connection closed')

    // Handle connectionReplaced - another session took over
    if (statusCode === 440) { // connectionReplaced
      logger.warn('Connection replaced by another session. Close WhatsApp Web in your browser or remove old linked devices.')
      // Wait longer before reconnecting to avoid loop
      if (reconnectAttempts < 3) {
        const delay = 10000 // Wait 10 seconds
        reconnectAttempts++
        logger.info({ attempt: reconnectAttempts, delay }, 'Waiting before reconnection...')
        setTimeout(() => {
          connect().catch(err => {
            logger.error({ err }, 'Reconnection failed')
          })
        }, delay)
      } else {
        logger.error('Connection keeps being replaced. Please close other WhatsApp Web sessions and restart the bot.')
      }
      return
    }

    // Determine if we should reconnect
    const shouldReconnect = !isIntentionalDisconnect && statusCode !== DisconnectReason.loggedOut

    if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = getReconnectDelay()
      reconnectAttempts++
      logger.info({ attempt: reconnectAttempts, delay }, 'Scheduling reconnection')

      setTimeout(() => {
        connect().catch(err => {
          logger.error({ err }, 'Reconnection failed')
        })
      }, delay)
    } else if (statusCode === DisconnectReason.loggedOut) {
      // When using pairing code, loggedOut can be normal before pairing completes
      if (config.usePairingCode && !pairingCodeRequested) {
        logger.info('Session not authenticated yet - will request pairing code')
        sessionState = null
        reconnectAttempts = 0
        setTimeout(() => {
          connect().catch(err => {
            logger.error({ err }, 'Failed to start new session')
          })
        }, 2000)
      } else if (config.usePairingCode && pairingCodeRequested) {
        // Pairing code was shown but connection closed - generate a new code
        logger.warn('Connection closed after pairing code shown. Generating new code...')
        sessionState = null
        pairingCodeRequested = false
        setTimeout(() => {
          connect().catch(err => {
            logger.error({ err }, 'Failed to reconnect for new pairing code')
          })
        }, 5000) // Wait 5 seconds before generating new code
      } else {
        logger.error('Session logged out - please scan QR code again')
        sessionState = null
        pairingCodeRequested = false
        reconnectAttempts = 0
        setTimeout(() => {
          connect().catch(err => {
            logger.error({ err }, 'Failed to start new session')
          })
        }, 2000)
      }
    } else {
      logger.error({ attempts: reconnectAttempts }, 'Max reconnection attempts reached')
    }
  }

  if (connection === 'connecting') {
    logger.info('Connecting to WhatsApp...')

    // Request pairing code when connecting (not authenticated yet)
    if (config.usePairingCode && socket && !socket.authState.creds.registered && !pairingCodeRequested) {
      setTimeout(() => {
        if (socket && !pairingCodeRequested) {
          requestPairingCode(socket)
        }
      }, 3000) // Wait 3 seconds for socket to stabilize
    }
  }

  if (connection === 'open') {
    reconnectAttempts = 0 // Reset on successful connection
    const user = socket?.user
    logger.info({
      name: user?.name,
      id: user?.id,
    }, 'Connected to WhatsApp successfully!')
  }

  // Call external callback if set
  if (onConnectionUpdate) {
    onConnectionUpdate(update)
  }
}

/**
 * Handle credential updates (save session)
 */
async function handleCredsUpdate(): Promise<void> {
  if (sessionState) {
    await sessionState.saveCreds()
    logger.debug('Credentials saved')
  }
}

/**
 * Handle incoming messages
 */
function handleMessagesUpsert(upsert: { messages: any[]; type: string }): void {
  const { type } = upsert

  // Only process new messages (not history sync)
  if (type !== 'notify') return

  // Call external callback if set
  if (onMessagesUpsert) {
    onMessagesUpsert(upsert)
  }
}

/**
 * Register all event handlers on the socket
 */
function registerEventHandlers(sock: WASocket): void {
  // Connection events
  sock.ev.on('connection.update', handleConnectionUpdate)
  sock.ev.on('creds.update', handleCredsUpdate)

  // Message events
  sock.ev.on('messages.upsert', handleMessagesUpsert)

  // Optional: Handle other events
  sock.ev.on('messages.update', (updates) => {
    logger.debug({ count: updates.length }, 'Messages updated')
  })

  sock.ev.on('presence.update', (presence) => {
    logger.debug({ id: presence.id }, 'Presence update')
  })
}

/**
 * Connect to WhatsApp
 */
export async function connect(): Promise<WASocket> {
  logger.info('Starting WhatsApp connection...')
  isIntentionalDisconnect = false
  pairingCodeRequested = false // Reset pairing code state

  if (config.usePairingCode) {
    logger.info('Using pairing code authentication mode')
  }

  try {
    socket = await createSocket()
    registerEventHandlers(socket)
    return socket
  } catch (error) {
    logger.error({ err: error }, 'Failed to create socket')
    throw error
  }
}

/**
 * Disconnect from WhatsApp
 */
export async function disconnect(): Promise<void> {
  if (socket) {
    isIntentionalDisconnect = true
    logger.info('Disconnecting from WhatsApp...')

    try {
      await socket.logout()
    } catch {
      // Ignore logout errors
    }

    socket.end(undefined)
    socket = null
    logger.info('Disconnected')
  }
}

/**
 * Gracefully close connection without logging out
 */
export async function close(): Promise<void> {
  if (socket) {
    isIntentionalDisconnect = true
    logger.info('Closing WhatsApp connection...')
    socket.end(undefined)
    socket = null
  }
}

export default {
  connect,
  disconnect,
  close,
  getSocket,
  isConnected,
  setConnectionCallback,
  setMessageCallback,
}
