/**
 * Bot Events - Event emitter for real-time dashboard notifications
 * Provides a typed event system for bot state changes and messages
 */

import { EventEmitter } from 'events';
import type {
  BotEventType,
  BotEventPayloads,
  ConnectionStatus,
  BotStats,
  BotUser,
  MessageStatus,
} from '@/types/bot';
import type { WAMessage } from '@whiskeysockets/baileys';

/**
 * Typed event listener function
 */
type BotEventListener<T extends BotEventType> = (
  payload: BotEventPayloads[T]
) => void;

/**
 * Bot Event Emitter
 * A typed wrapper around Node's EventEmitter for bot events
 */
class BotEventEmitter {
  private emitter: EventEmitter;
  private maxListeners: number = 50;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(this.maxListeners);
  }

  /**
   * Subscribe to a bot event
   */
  on<T extends BotEventType>(event: T, listener: BotEventListener<T>): void {
    this.emitter.on(event, listener);
  }

  /**
   * Subscribe to a bot event once
   */
  once<T extends BotEventType>(event: T, listener: BotEventListener<T>): void {
    this.emitter.once(event, listener);
  }

  /**
   * Unsubscribe from a bot event
   */
  off<T extends BotEventType>(event: T, listener: BotEventListener<T>): void {
    this.emitter.off(event, listener);
  }

  /**
   * Emit a bot event
   */
  emit<T extends BotEventType>(event: T, payload: BotEventPayloads[T]): boolean {
    return this.emitter.emit(event, payload);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: BotEventType): void {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: BotEventType): number {
    return this.emitter.listenerCount(event);
  }

  // Convenience emit methods for common events

  /**
   * Emit connection status change
   */
  emitConnectionChange(status: ConnectionStatus, phoneNumber?: string): void {
    this.emit('connection', { status, phoneNumber });
  }

  /**
   * Emit QR code for scanning
   */
  emitQRCode(qrCode: string): void {
    this.emit('qr', { qrCode });
  }

  /**
   * Emit pairing code
   */
  emitPairingCode(code: string): void {
    this.emit('pairing-code', { code });
  }

  /**
   * Emit incoming message
   */
  emitIncomingMessage(message: WAMessage, jid: string, fromMe: boolean): void {
    this.emit('message:incoming', { message, jid, fromMe });
  }

  /**
   * Emit outgoing message
   */
  emitOutgoingMessage(message: WAMessage, jid: string): void {
    this.emit('message:outgoing', { message, jid });
  }

  /**
   * Emit message status update
   */
  emitMessageStatus(messageId: string, status: MessageStatus): void {
    this.emit('message:status', { messageId, status });
  }

  /**
   * Emit user update
   */
  emitUserUpdate(user: BotUser): void {
    this.emit('user:update', { user });
  }

  /**
   * Emit stats update
   */
  emitStatsUpdate(stats: BotStats): void {
    this.emit('stats:update', { stats });
  }

  /**
   * Emit error
   */
  emitError(error: Error, context?: string): void {
    this.emit('error', { error, context });
  }

  // Convenience subscription methods

  /**
   * Subscribe to QR code updates
   */
  onQRCode(listener: (qrCode: string) => void): void {
    this.on('qr', ({ qrCode }) => listener(qrCode));
  }

  /**
   * Subscribe to pairing code updates
   */
  onPairingCode(listener: (code: string) => void): void {
    this.on('pairing-code', ({ code }) => listener(code));
  }

  /**
   * Subscribe to connection changes
   */
  onConnectionChange(listener: (status: ConnectionStatus, phoneNumber?: string) => void): void {
    this.on('connection', ({ status, phoneNumber }) => listener(status, phoneNumber));
  }

  /**
   * Subscribe to stats updates
   */
  onStatsUpdate(listener: (stats: BotStats) => void): void {
    this.on('stats:update', ({ stats }) => listener(stats));
  }

  /**
   * Subscribe to errors
   */
  onError(listener: (error: Error, context?: string) => void): void {
    this.on('error', ({ error, context }) => listener(error, context));
  }
}

// Singleton instance
let botEvents: BotEventEmitter | null = null;

/**
 * Get the bot event emitter singleton
 */
export function getBotEvents(): BotEventEmitter {
  if (!botEvents) {
    botEvents = new BotEventEmitter();
  }
  return botEvents;
}

/**
 * Reset the event emitter (for testing)
 */
export function resetBotEvents(): void {
  if (botEvents) {
    botEvents.removeAllListeners();
    botEvents = null;
  }
}

// Export the class for type reference
export { BotEventEmitter };

// Export convenience functions that use the singleton
export const onBotEvent = <T extends BotEventType>(
  event: T,
  listener: BotEventListener<T>
): void => getBotEvents().on(event, listener);

export const onceBotEvent = <T extends BotEventType>(
  event: T,
  listener: BotEventListener<T>
): void => getBotEvents().once(event, listener);

export const offBotEvent = <T extends BotEventType>(
  event: T,
  listener: BotEventListener<T>
): void => getBotEvents().off(event, listener);

export const emitBotEvent = <T extends BotEventType>(
  event: T,
  payload: BotEventPayloads[T]
): boolean => getBotEvents().emit(event, payload);
