// Socket.IO Server Setup for WA Bot Dashboard
// Provides real-time communication between the dashboard and bot

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  BotState,
  BotStats,
  LogEntry,
  LogLevel,
  TypedServer,
  TypedSocket,
  SendMessageData,
} from './events';
import { ROOMS, EVENTS } from './events';
import { getBotManager, getBotEvents } from '@/lib/bot';

// =============================================================================
// Singleton Socket Server Manager
// =============================================================================

class SocketServerManager {
  private static instance: SocketServerManager | null = null;
  private io: TypedServer | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private currentBotState: BotState = {
    status: 'disconnected',
    qrCode: null,
    pairingCode: null,
    phoneNumber: null,
    uptime: 0,
  };
  private currentStats: BotStats = {
    messagesReceived: 0,
    messagesSent: 0,
    commandsExecuted: 0,
    errors: 0,
    uptime: 0,
    activeChats: 0,
    totalUsers: 0,
  };

  private constructor() {}

  static getInstance(): SocketServerManager {
    if (!SocketServerManager.instance) {
      SocketServerManager.instance = new SocketServerManager();
    }
    return SocketServerManager.instance;
  }

  // Initialize Socket.IO server with HTTP server
  initialize(httpServer: HttpServer): TypedServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    this.startStatsInterval();

    console.log('[Socket.IO] Server initialized');
    return this.io;
  }

  // Get the Socket.IO server instance
  getIO(): TypedServer | null {
    return this.io;
  }

  // Check if server is initialized
  isInitialized(): boolean {
    return this.io !== null;
  }

  // Setup all event handlers
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: TypedSocket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      // Initialize socket data
      socket.data.subscribedToLogs = false;
      socket.data.joinedChats = new Set();

      // Send current bot state on connection
      socket.emit(EVENTS.CONNECTION_STATUS, this.currentBotState);

      // Handle bot connect request
      socket.on(EVENTS.BOT_CONNECT, (options) => {
        console.log(`[Socket.IO] Bot connect requested by ${socket.id}`, options);
        // Bot service integration will handle actual connection
        // Emit to bot service via event emitter (Phase 2B integration)
        this.handleBotConnect(options);
      });

      // Handle bot disconnect request
      socket.on(EVENTS.BOT_DISCONNECT, () => {
        console.log(`[Socket.IO] Bot disconnect requested by ${socket.id}`);
        this.handleBotDisconnect();
      });

      // Handle send message request
      socket.on(EVENTS.MESSAGE_SEND, (data: SendMessageData) => {
        console.log(`[Socket.IO] Message send requested by ${socket.id}`, data);
        this.handleSendMessage(socket, data);
      });

      // Handle log subscription
      socket.on(EVENTS.SUBSCRIBE_LOGS, (options) => {
        socket.join(ROOMS.LOGS);
        socket.data.subscribedToLogs = true;
        socket.data.logLevel = options?.level || 'info';
        console.log(`[Socket.IO] Client ${socket.id} subscribed to logs`);
      });

      // Handle log unsubscription
      socket.on(EVENTS.UNSUBSCRIBE_LOGS, () => {
        socket.leave(ROOMS.LOGS);
        socket.data.subscribedToLogs = false;
        console.log(`[Socket.IO] Client ${socket.id} unsubscribed from logs`);
      });

      // Handle bot status request
      socket.on(EVENTS.BOT_STATUS, () => {
        socket.emit(EVENTS.CONNECTION_STATUS, this.currentBotState);
      });

      // Handle stats request
      socket.on(EVENTS.STATS_REQUEST, () => {
        socket.emit(EVENTS.STATS_UPDATE, this.currentStats);
      });

      // Handle chat room join
      socket.on(EVENTS.CHAT_JOIN, (jid: string) => {
        const room = ROOMS.chatRoom(jid);
        socket.join(room);
        socket.data.joinedChats.add(jid);
        console.log(`[Socket.IO] Client ${socket.id} joined chat ${jid}`);
      });

      // Handle chat room leave
      socket.on(EVENTS.CHAT_LEAVE, (jid: string) => {
        const room = ROOMS.chatRoom(jid);
        socket.leave(room);
        socket.data.joinedChats.delete(jid);
        console.log(`[Socket.IO] Client ${socket.id} left chat ${jid}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
      });
    });
  }

  // Start periodic stats broadcast
  private startStatsInterval(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(() => {
      if (this.io) {
        // Update uptime
        if (this.currentBotState.status === 'connected') {
          this.currentStats.uptime += 5;
          this.currentBotState.uptime += 5;
        }
        this.io.emit(EVENTS.STATS_UPDATE, this.currentStats);
      }
    }, 5000); // Every 5 seconds
  }

  // =============================================================================
  // Bot Event Handlers (to be integrated with Bot Service in Phase 2B)
  // =============================================================================

  private botEventsSubscribed = false;

  private subscribeToBotEvents(): void {
    if (this.botEventsSubscribed) return;

    const botEvents = getBotEvents();

    // Subscribe to bot events to relay to clients
    botEvents.onQRCode((qr) => {
      console.log('[Socket.IO] QR Code received');
      this.emitQRCode(qr);
    });

    botEvents.onConnectionChange((status, phoneNumber) => {
      console.log('[Socket.IO] Connection status changed:', status, phoneNumber);
      this.updateBotState({
        status,
        phoneNumber: phoneNumber || null,
        qrCode: status === 'connected' ? null : this.currentBotState.qrCode,
      });
    });

    botEvents.onPairingCode((code) => {
      console.log('[Socket.IO] Pairing code received:', code);
      this.emitPairingCode(code);
    });

    botEvents.onStatsUpdate((stats) => {
      this.updateStats({
        messagesReceived: stats.messagesReceived,
        messagesSent: stats.messagesSent,
        commandsExecuted: stats.commandsExecuted,
        errors: stats.errors,
        uptime: stats.uptime,
      });
    });

    this.botEventsSubscribed = true;
    console.log('[Socket.IO] Bot events subscribed');
  }

  private async handleBotConnect(options?: { usePairingCode?: boolean; phoneNumber?: string }): Promise<void> {
    // Update state to connecting
    this.updateBotState({ status: 'connecting' });

    console.log('[Socket.IO] Bot connection initiated', options);

    try {
      // Subscribe to bot events (only once)
      this.subscribeToBotEvents();

      const botManager = getBotManager();
      // Connect with options (phone number for pairing code)
      await botManager.connect(options);
    } catch (error) {
      console.error('[Socket.IO] Bot connection error:', error);
      this.updateBotState({ status: 'disconnected' });
      this.emitError('CONNECTION_ERROR', error instanceof Error ? error.message : 'Failed to connect');
    }
  }

  private async handleBotDisconnect(): Promise<void> {
    console.log('[Socket.IO] Bot disconnection initiated');

    try {
      const botManager = getBotManager();
      await botManager.disconnect();

      this.updateBotState({
        status: 'disconnected',
        qrCode: null,
        pairingCode: null,
      });
    } catch (error) {
      console.error('[Socket.IO] Bot disconnection error:', error);
      this.emitError('DISCONNECT_ERROR', error instanceof Error ? error.message : 'Failed to disconnect');
    }
  }

  private handleSendMessage(socket: TypedSocket, data: SendMessageData): void {
    // This will be integrated with the bot service in Phase 2B
    console.log('[Socket.IO] Send message requested', data);

    // For now, emit an error since bot service is not yet integrated
    socket.emit(EVENTS.ERROR, {
      code: 'BOT_NOT_CONNECTED',
      message: 'Bot service is not connected',
    });
  }

  // =============================================================================
  // Public Methods for Bot Service Integration
  // =============================================================================

  // Update and broadcast bot state
  updateBotState(updates: Partial<BotState>): void {
    this.currentBotState = { ...this.currentBotState, ...updates };
    if (this.io) {
      this.io.emit(EVENTS.CONNECTION_STATUS, this.currentBotState);
    }
  }

  // Update and broadcast stats
  updateStats(updates: Partial<BotStats>): void {
    this.currentStats = { ...this.currentStats, ...updates };
    // Stats are broadcasted periodically, but we can also broadcast immediately
    if (this.io) {
      this.io.emit(EVENTS.STATS_UPDATE, this.currentStats);
    }
  }

  // Broadcast incoming message
  emitIncomingMessage(message: import('@/types/database').Message): void {
    if (!this.io) return;

    // Broadcast to all clients
    this.io.emit(EVENTS.MESSAGE_INCOMING, message);

    // Also broadcast to specific chat room
    this.io.to(ROOMS.chatRoom(message.jid)).emit(EVENTS.MESSAGE_INCOMING, message);

    // Update stats
    this.currentStats.messagesReceived++;
  }

  // Broadcast outgoing message
  emitOutgoingMessage(message: import('@/types/database').Message): void {
    if (!this.io) return;

    // Broadcast to all clients
    this.io.emit(EVENTS.MESSAGE_OUTGOING, message);

    // Also broadcast to specific chat room
    this.io.to(ROOMS.chatRoom(message.jid)).emit(EVENTS.MESSAGE_OUTGOING, message);

    // Update stats
    this.currentStats.messagesSent++;
  }

  // Broadcast message status update
  emitMessageStatus(messageId: string, status: import('./events').MessageStatus): void {
    if (!this.io) return;

    this.io.emit(EVENTS.MESSAGE_STATUS, {
      messageId,
      status,
      timestamp: Date.now(),
    });
  }

  // Broadcast user update
  emitUserUpdate(user: import('@/types/database').User): void {
    if (!this.io) return;
    this.io.emit(EVENTS.USER_UPDATE, user);
  }

  // Broadcast log entry
  emitLogEntry(entry: LogEntry): void {
    if (!this.io) return;

    // Only send to clients subscribed to logs
    this.io.to(ROOMS.LOGS).emit(EVENTS.LOG_ENTRY, entry);
  }

  // Broadcast command executed
  emitCommandExecuted(log: import('@/types/database').CommandLog): void {
    if (!this.io) return;

    this.io.emit(EVENTS.COMMAND_EXECUTED, log);

    // Update stats
    this.currentStats.commandsExecuted++;
  }

  // Broadcast QR code update
  emitQRCode(qrCode: string): void {
    this.updateBotState({ qrCode, status: 'connecting' });
    if (this.io) {
      this.io.emit(EVENTS.QR_UPDATE, qrCode);
    }
  }

  // Broadcast pairing code
  emitPairingCode(code: string): void {
    this.updateBotState({ pairingCode: code, status: 'connecting' });
    if (this.io) {
      this.io.emit(EVENTS.PAIRING_CODE, code);
    }
  }

  // Broadcast error
  emitError(code: string, message: string): void {
    if (!this.io) return;

    this.io.emit(EVENTS.ERROR, { code, message });
    this.currentStats.errors++;
  }

  // Get current bot state
  getBotState(): BotState {
    return { ...this.currentBotState };
  }

  // Get current stats
  getStats(): BotStats {
    return { ...this.currentStats };
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.io?.sockets.sockets.size || 0;
  }

  // Cleanup
  shutdown(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    console.log('[Socket.IO] Server shutdown');
  }
}

// =============================================================================
// Exports
// =============================================================================

// Export singleton instance getter
export const getSocketManager = (): SocketServerManager => {
  return SocketServerManager.getInstance();
};

// Export for convenience
export const socketManager = SocketServerManager.getInstance();

// Helper to create a log entry
export function createLogEntry(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): LogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    level,
    message,
    timestamp: Date.now(),
    metadata,
  };
}

// Helper function to emit a log from anywhere in the app
export function emitLog(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const entry = createLogEntry(level, message, metadata);
  socketManager.emitLogEntry(entry);
}
