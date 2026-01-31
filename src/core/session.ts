import { useMultiFileAuthState, AuthenticationState } from '@whiskeysockets/baileys'
import { createLogger } from '../utils/logger'
import { config } from '../config'
import fs from 'fs'
import path from 'path'

const logger = createLogger('session')

export interface SessionState {
  state: AuthenticationState
  saveCreds: () => Promise<void>
}

/**
 * Ensure the auth folder exists
 */
function ensureAuthFolder(): void {
  const authPath = path.resolve(config.authFolder)
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true })
    logger.info({ path: authPath }, 'Created auth folder')
  }
}

/**
 * Initialize and return the authentication state
 * Uses file-based storage for session persistence
 */
export async function initSession(): Promise<SessionState> {
  ensureAuthFolder()

  const authPath = path.resolve(config.authFolder)
  logger.info({ path: authPath }, 'Initializing session from auth folder')

  const { state, saveCreds } = await useMultiFileAuthState(authPath)

  // Check if we have existing credentials
  const hasExistingSession = state.creds?.registered === true
  if (hasExistingSession) {
    logger.info('Found existing session credentials')
  } else {
    logger.info('No existing session found - QR code authentication required')
  }

  return { state, saveCreds }
}

/**
 * Check if a valid session exists
 */
export function sessionExists(): boolean {
  const authPath = path.resolve(config.authFolder)
  const credsPath = path.join(authPath, 'creds.json')
  return fs.existsSync(credsPath)
}

/**
 * Clear the current session (for logout)
 */
export async function clearSession(): Promise<void> {
  const authPath = path.resolve(config.authFolder)

  if (fs.existsSync(authPath)) {
    const files = fs.readdirSync(authPath)
    for (const file of files) {
      fs.unlinkSync(path.join(authPath, file))
    }
    logger.info('Session cleared successfully')
  }
}

export default { initSession, sessionExists, clearSession }
