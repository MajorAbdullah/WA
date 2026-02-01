'use client';

// Socket.IO Provider Component
// Provides socket context throughout the React application

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  BotState,
  BotStats,
  LogEntry,
  SendMessageData,
  LogLevel,
} from '@/lib/socket/events';
import { EVENTS } from '@/lib/socket/events';
import type { Message, User, CommandLog } from '@/types/database';

// =============================================================================
// Types
// =============================================================================

type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: TypedClientSocket | null;
  isConnected: boolean;
  botState: BotState;
  botStats: BotStats;

  // Bot control
  connectBot: (options?: { usePairingCode?: boolean; phoneNumber?: string }) => void;
  disconnectBot: () => void;
  requestBotStatus: () => void;
  requestStats: () => void;

  // Messaging
  sendMessage: (data: SendMessageData) => void;

  // Chat rooms
  joinChat: (jid: string) => void;
  leaveChat: (jid: string) => void;

  // Logs
  subscribeLogs: (level?: LogLevel) => void;
  unsubscribeLogs: () => void;

  // Event listeners
  onIncomingMessage: (callback: (message: Message) => void) => () => void;
  onOutgoingMessage: (callback: (message: Message) => void) => () => void;
  onUserUpdate: (callback: (user: User) => void) => () => void;
  onLogEntry: (callback: (log: LogEntry) => void) => () => void;
  onCommandExecuted: (callback: (log: CommandLog) => void) => () => void;
  onQRCode: (callback: (qrCode: string) => void) => () => void;
  onPairingCode: (callback: (code: string) => void) => () => void;
  onError: (callback: (error: { code: string; message: string }) => void) => () => void;
}

// =============================================================================
// Default Values
// =============================================================================

const defaultBotState: BotState = {
  status: 'disconnected',
  qrCode: null,
  pairingCode: null,
  phoneNumber: null,
  uptime: 0,
};

const defaultBotStats: BotStats = {
  messagesReceived: 0,
  messagesSent: 0,
  commandsExecuted: 0,
  errors: 0,
  uptime: 0,
  activeChats: 0,
  totalUsers: 0,
};

// =============================================================================
// Context
// =============================================================================

const SocketContext = createContext<SocketContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface SocketProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export function SocketProvider({ children, autoConnect = true }: SocketProviderProps) {
  const socketRef = useRef<TypedClientSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [botState, setBotState] = useState<BotState>(defaultBotState);
  const [botStats, setBotStats] = useState<BotStats>(defaultBotStats);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    socketRef.current = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[SocketProvider] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SocketProvider] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[SocketProvider] Connection error:', error);
      setIsConnected(false);
    });

    socket.on(EVENTS.CONNECTION_STATUS, (state: BotState) => {
      setBotState(state);
    });

    socket.on(EVENTS.STATS_UPDATE, (stats: BotStats) => {
      setBotStats(stats);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect]);

  // Bot control methods
  const connectBot = useCallback((options?: { usePairingCode?: boolean; phoneNumber?: string }) => {
    socketRef.current?.emit(EVENTS.BOT_CONNECT, options);
  }, []);

  const disconnectBot = useCallback(() => {
    socketRef.current?.emit(EVENTS.BOT_DISCONNECT);
  }, []);

  const requestBotStatus = useCallback(() => {
    socketRef.current?.emit(EVENTS.BOT_STATUS);
  }, []);

  const requestStats = useCallback(() => {
    socketRef.current?.emit(EVENTS.STATS_REQUEST);
  }, []);

  // Messaging
  const sendMessage = useCallback((data: SendMessageData) => {
    socketRef.current?.emit(EVENTS.MESSAGE_SEND, data);
  }, []);

  // Chat rooms
  const joinChat = useCallback((jid: string) => {
    socketRef.current?.emit(EVENTS.CHAT_JOIN, jid);
  }, []);

  const leaveChat = useCallback((jid: string) => {
    socketRef.current?.emit(EVENTS.CHAT_LEAVE, jid);
  }, []);

  // Logs
  const subscribeLogs = useCallback((level?: LogLevel) => {
    socketRef.current?.emit(EVENTS.SUBSCRIBE_LOGS, { level });
  }, []);

  const unsubscribeLogs = useCallback(() => {
    socketRef.current?.emit(EVENTS.UNSUBSCRIBE_LOGS);
  }, []);

  // Event listener factories
  const createEventListener = useCallback(<T,>(event: keyof ServerToClientEvents) => {
    return (callback: (data: T) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};

      const handler = callback as (...args: unknown[]) => void;
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    };
  }, []);

  const onIncomingMessage = useCallback((callback: (message: Message) => void) => {
    return createEventListener<Message>(EVENTS.MESSAGE_INCOMING)(callback);
  }, [createEventListener]);

  const onOutgoingMessage = useCallback((callback: (message: Message) => void) => {
    return createEventListener<Message>(EVENTS.MESSAGE_OUTGOING)(callback);
  }, [createEventListener]);

  const onUserUpdate = useCallback((callback: (user: User) => void) => {
    return createEventListener<User>(EVENTS.USER_UPDATE)(callback);
  }, [createEventListener]);

  const onLogEntry = useCallback((callback: (log: LogEntry) => void) => {
    return createEventListener<LogEntry>(EVENTS.LOG_ENTRY)(callback);
  }, [createEventListener]);

  const onCommandExecuted = useCallback((callback: (log: CommandLog) => void) => {
    return createEventListener<CommandLog>(EVENTS.COMMAND_EXECUTED)(callback);
  }, [createEventListener]);

  const onQRCode = useCallback((callback: (qrCode: string) => void) => {
    return createEventListener<string>(EVENTS.QR_UPDATE)(callback);
  }, [createEventListener]);

  const onPairingCode = useCallback((callback: (code: string) => void) => {
    return createEventListener<string>(EVENTS.PAIRING_CODE)(callback);
  }, [createEventListener]);

  const onError = useCallback((callback: (error: { code: string; message: string }) => void) => {
    return createEventListener<{ code: string; message: string }>(EVENTS.ERROR)(callback);
  }, [createEventListener]);

  const value: SocketContextValue = {
    socket: socketRef.current,
    isConnected,
    botState,
    botStats,
    connectBot,
    disconnectBot,
    requestBotStatus,
    requestStats,
    sendMessage,
    joinChat,
    leaveChat,
    subscribeLogs,
    unsubscribeLogs,
    onIncomingMessage,
    onOutgoingMessage,
    onUserUpdate,
    onLogEntry,
    onCommandExecuted,
    onQRCode,
    onPairingCode,
    onError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export default SocketProvider;
