/**
 * Bot Manager - Singleton pattern for managing the WhatsApp bot instance
 * Provides centralized control for bot connection, status, and operations
 */

import type {
  BotState,
  BotStats,
  ExtendedBotStats,
  ConnectionStatus,
  BotUser,
  SendMessageOptions,
  SessionInfo,
} from '@/types/bot';
import { getBotEvents } from './events';
import * as adapter from './adapter';
import QRCode from 'qrcode';

/**
 * Bot Manager Class
 * Singleton that manages the bot lifecycle and state
 */
class BotManager {
  private static instance: BotManager | null = null;

  private state: BotState = {
    status: 'disconnected',
    qrCode: null,
    pairingCode: null,
    phoneNumber: null,
    uptime: 0,
    botName: process.env.BOT_NAME || 'WhatsAppBot',
    lastConnected: null,
    lastDisconnected: null,
  };

  private uptimeInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager();
    }
    return BotManager.instance;
  }

  /**
   * Initialize the bot manager
   * Sets up event callbacks and prepares for connection
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Bot Manager] Already initialized, skipping');
      return;
    }

    console.log('[Bot Manager] Initializing...');
    const events = getBotEvents();

    // Set up connection callback
    console.log('[Bot Manager] Setting up connection callback...');
    await adapter.setConnectionCallback((update) => {
      console.log('[Bot Manager] Connection callback invoked!');
      this.handleConnectionUpdate(update);
    });

    // Set up message callback
    await adapter.setMessageCallback((messages) => {
      this.handleMessages(messages);
    });

    this.isInitialized = true;
  }

  /**
   * Handle connection state updates
   */
  private async handleConnectionUpdate(update: {
    connection?: string;
    lastDisconnect?: { error?: Error };
    qr?: string;
  }): Promise<void> {
    const events = getBotEvents();

    // Debug: Log what we receive
    console.log('[Bot Manager] Connection update received:', JSON.stringify(update, null, 2));

    if (update.qr) {
      // Convert QR string to data URL for display in browser
      try {
        const qrDataUrl = await QRCode.toDataURL(update.qr, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        this.state.qrCode = qrDataUrl;
        this.state.status = 'connecting';
        events.emitQRCode(qrDataUrl);
        events.emitConnectionChange('connecting');
        console.log('[Bot Manager] QR code generated and emitted');
      } catch (err) {
        console.error('[Bot Manager] Failed to generate QR code:', err);
      }
    }

    if (update.connection === 'open') {
      this.state.status = 'connected';
      this.state.qrCode = null;
      this.state.lastConnected = new Date();
      this.startUptimeCounter();
      this.startStatsUpdater();
      events.emitConnectionChange('connected', this.state.phoneNumber ?? undefined);
    }

    if (update.connection === 'close') {
      const shouldReconnect = update.lastDisconnect?.error?.message !== 'loggedOut';
      this.state.status = 'disconnected';
      this.state.lastDisconnected = new Date();
      this.stopUptimeCounter();
      this.stopStatsUpdater();
      events.emitConnectionChange('disconnected');

      if (update.lastDisconnect?.error) {
        events.emitError(update.lastDisconnect.error, 'connection');
      }
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessages(messages: unknown): void {
    const events = getBotEvents();

    if (!messages || !Array.isArray(messages)) {
      return;
    }

    for (const msg of messages) {
      if (msg && typeof msg === 'object' && 'key' in msg) {
        const jid = (msg.key as { remoteJid?: string }).remoteJid || '';
        const fromMe = (msg.key as { fromMe?: boolean }).fromMe || false;

        if (fromMe) {
          events.emitOutgoingMessage(msg as Parameters<typeof events.emitOutgoingMessage>[0], jid);
        } else {
          events.emitIncomingMessage(msg as Parameters<typeof events.emitIncomingMessage>[0], jid, fromMe);
        }
      }
    }
  }

  /**
   * Start the uptime counter
   */
  private startUptimeCounter(): void {
    this.state.uptime = 0;
    this.uptimeInterval = setInterval(() => {
      this.state.uptime += 1000;
    }, 1000);
  }

  /**
   * Stop the uptime counter
   */
  private stopUptimeCounter(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }
  }

  /**
   * Start periodic stats updates
   */
  private startStatsUpdater(): void {
    const events = getBotEvents();

    // Emit stats every 5 seconds
    this.statsInterval = setInterval(async () => {
      try {
        const stats = await this.getStats();
        events.emitStatsUpdate(stats);
      } catch {
        // Ignore errors in stats updates
      }
    }, 5000);
  }

  /**
   * Stop stats updater
   */
  private stopStatsUpdater(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Connect the bot to WhatsApp
   */
  public async connect(options?: { usePairingCode?: boolean; phoneNumber?: string }): Promise<void> {
    if (this.state.status === 'connected') {
      return;
    }

    await this.initialize();

    this.state.status = 'connecting';
    getBotEvents().emitConnectionChange('connecting');

    try {
      await adapter.startBot(options);
    } catch (error) {
      this.state.status = 'disconnected';
      getBotEvents().emitConnectionChange('disconnected');
      getBotEvents().emitError(
        error instanceof Error ? error : new Error(String(error)),
        'connect'
      );
      throw error;
    }
  }

  /**
   * Disconnect the bot gracefully
   */
  public async disconnect(): Promise<void> {
    if (this.state.status === 'disconnected') {
      return;
    }

    try {
      await adapter.stopBot();
      this.state.status = 'disconnected';
      this.state.lastDisconnected = new Date();
      this.stopUptimeCounter();
      this.stopStatsUpdater();
      getBotEvents().emitConnectionChange('disconnected');
    } catch (error) {
      getBotEvents().emitError(
        error instanceof Error ? error : new Error(String(error)),
        'disconnect'
      );
      throw error;
    }
  }

  /**
   * Logout the bot (clears session)
   */
  public async logout(): Promise<void> {
    try {
      await adapter.logoutBot();
      this.state.status = 'disconnected';
      this.state.qrCode = null;
      this.state.pairingCode = null;
      this.state.phoneNumber = null;
      this.state.lastDisconnected = new Date();
      this.stopUptimeCounter();
      this.stopStatsUpdater();
      getBotEvents().emitConnectionChange('disconnected');
    } catch (error) {
      getBotEvents().emitError(
        error instanceof Error ? error : new Error(String(error)),
        'logout'
      );
      throw error;
    }
  }

  /**
   * Get current bot state
   */
  public getState(): BotState {
    return { ...this.state };
  }

  /**
   * Get connection status
   */
  public getStatus(): ConnectionStatus {
    return this.state.status;
  }

  /**
   * Get bot statistics
   */
  public async getStats(): Promise<BotStats> {
    return adapter.getStats();
  }

  /**
   * Get extended statistics
   */
  public async getExtendedStats(): Promise<ExtendedBotStats> {
    return adapter.getExtendedStats();
  }

  /**
   * Check if connected
   */
  public async isConnected(): Promise<boolean> {
    return adapter.isConnected();
  }

  // ==========================================================================
  // Message Operations
  // ==========================================================================

  /**
   * Send a message
   */
  public async sendMessage(options: SendMessageOptions): Promise<void> {
    if (this.state.status !== 'connected') {
      throw new Error('Bot is not connected');
    }
    await adapter.sendMessage(options);
  }

  /**
   * Send a text message
   */
  public async sendText(jid: string, text: string): Promise<void> {
    if (this.state.status !== 'connected') {
      throw new Error('Bot is not connected');
    }
    await adapter.sendTextMessage(jid, text);
  }

  // ==========================================================================
  // User Operations
  // ==========================================================================

  /**
   * Get all users
   */
  public async getUsers(): Promise<BotUser[]> {
    return adapter.getUsers();
  }

  /**
   * Get a specific user
   */
  public async getUser(jid: string): Promise<BotUser | null> {
    return adapter.getUser(jid);
  }

  /**
   * Get banned users
   */
  public async getBannedUsers(): Promise<BotUser[]> {
    return adapter.getBannedUsers();
  }

  /**
   * Ban a user
   */
  public async banUser(jid: string, reason?: string): Promise<boolean> {
    const success = await adapter.banUser(jid, reason);
    if (success) {
      const user = await adapter.getUser(jid);
      if (user) {
        getBotEvents().emitUserUpdate(user);
      }
    }
    return success;
  }

  /**
   * Unban a user
   */
  public async unbanUser(jid: string): Promise<boolean> {
    const success = await adapter.unbanUser(jid);
    if (success) {
      const user = await adapter.getUser(jid);
      if (user) {
        getBotEvents().emitUserUpdate(user);
      }
    }
    return success;
  }

  // ==========================================================================
  // Session Operations
  // ==========================================================================

  /**
   * Get session information
   */
  public async getSessionInfo(): Promise<SessionInfo> {
    return adapter.getSessionInfo();
  }

  /**
   * Clear the session
   */
  public async clearSession(): Promise<void> {
    await adapter.clearSession();
  }
}

// ==========================================================================
// Exports
// ==========================================================================

/**
 * Get the bot manager singleton
 */
export function getBotManager(): BotManager {
  return BotManager.getInstance();
}

// Re-export events
export * from './events';

// Re-export types
export type {
  BotState,
  BotStats,
  ExtendedBotStats,
  ConnectionStatus,
  BotUser,
  SendMessageOptions,
  SessionInfo,
} from '@/types/bot';

// Default export
export default getBotManager;
