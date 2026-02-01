'use client';

// React hook for Socket.IO connection
// Provides type-safe real-time communication with the server

import { useEffect, useRef, useCallback, useState } from 'react';
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

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: { code: string; message: string }) => void;
}

interface UseSocketReturn {
  // Connection state
  socket: TypedClientSocket | null;
  isConnected: boolean;

  // Bot state
  botState: BotState;
  botStats: BotStats;

  // Actions
  connect: () => void;
  disconnect: () => void;

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
}

// =============================================================================
// Default State
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
// Main Hook
// =============================================================================

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<TypedClientSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [botState, setBotState] = useState<BotState>(defaultBotState);
  const [botStats, setBotStats] = useState<BotStats>(defaultBotStats);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    socketRef.current = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.(reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      setIsConnected(false);
    });

    // Server event handlers
    socket.on(EVENTS.CONNECTION_STATUS, (state: BotState) => {
      console.log('[Socket] Bot state update:', state);
      setBotState(state);
    });

    socket.on(EVENTS.STATS_UPDATE, (stats: BotStats) => {
      setBotStats(stats);
    });

    socket.on(EVENTS.ERROR, (error) => {
      console.error('[Socket] Error:', error);
      onError?.(error);
    });

    // Connect the socket
    socket.connect();
  }, [onConnect, onDisconnect, onError]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

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

  // Messaging methods
  const sendMessage = useCallback((data: SendMessageData) => {
    socketRef.current?.emit(EVENTS.MESSAGE_SEND, data);
  }, []);

  // Chat room methods
  const joinChat = useCallback((jid: string) => {
    socketRef.current?.emit(EVENTS.CHAT_JOIN, jid);
  }, []);

  const leaveChat = useCallback((jid: string) => {
    socketRef.current?.emit(EVENTS.CHAT_LEAVE, jid);
  }, []);

  // Log subscription methods
  const subscribeLogs = useCallback((level?: LogLevel) => {
    socketRef.current?.emit(EVENTS.SUBSCRIBE_LOGS, { level });
  }, []);

  const unsubscribeLogs = useCallback(() => {
    socketRef.current?.emit(EVENTS.UNSUBSCRIBE_LOGS);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    botState,
    botStats,
    connect,
    disconnect,
    connectBot,
    disconnectBot,
    requestBotStatus,
    requestStats,
    sendMessage,
    joinChat,
    leaveChat,
    subscribeLogs,
    unsubscribeLogs,
  };
}

// =============================================================================
// Event-Specific Hooks
// =============================================================================

// Hook for subscribing to incoming messages
export function useIncomingMessages(
  callback: (message: Message) => void,
  deps: React.DependencyList = []
): void {
  const { socket, isConnected } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(EVENTS.MESSAGE_INCOMING, callback);

    return () => {
      socket.off(EVENTS.MESSAGE_INCOMING, callback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, ...deps]);
}

// Hook for subscribing to outgoing messages
export function useOutgoingMessages(
  callback: (message: Message) => void,
  deps: React.DependencyList = []
): void {
  const { socket, isConnected } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(EVENTS.MESSAGE_OUTGOING, callback);

    return () => {
      socket.off(EVENTS.MESSAGE_OUTGOING, callback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, ...deps]);
}

// Hook for subscribing to user updates
export function useUserUpdates(
  callback: (user: User) => void,
  deps: React.DependencyList = []
): void {
  const { socket, isConnected } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(EVENTS.USER_UPDATE, callback);

    return () => {
      socket.off(EVENTS.USER_UPDATE, callback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, ...deps]);
}

// Hook for subscribing to log entries
export function useLogs(
  callback: (log: LogEntry) => void,
  options: { level?: LogLevel; autoSubscribe?: boolean } = {}
): { subscribe: () => void; unsubscribe: () => void } {
  const { socket, isConnected, subscribeLogs, unsubscribeLogs } = useSocket({ autoConnect: true });
  const { level, autoSubscribe = true } = options;

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(EVENTS.LOG_ENTRY, callback);

    if (autoSubscribe) {
      subscribeLogs(level);
    }

    return () => {
      socket.off(EVENTS.LOG_ENTRY, callback);
      unsubscribeLogs();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, autoSubscribe, level]);

  return {
    subscribe: () => subscribeLogs(level),
    unsubscribe: unsubscribeLogs,
  };
}

// Hook for subscribing to command executions
export function useCommandLogs(
  callback: (log: CommandLog) => void,
  deps: React.DependencyList = []
): void {
  const { socket, isConnected } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(EVENTS.COMMAND_EXECUTED, callback);

    return () => {
      socket.off(EVENTS.COMMAND_EXECUTED, callback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, ...deps]);
}

// Hook for QR code updates
export function useQRCode(
  callback: (qrCode: string) => void,
  deps: React.DependencyList = []
): void {
  const { socket, isConnected } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(EVENTS.QR_UPDATE, callback);

    return () => {
      socket.off(EVENTS.QR_UPDATE, callback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, ...deps]);
}

// Hook for pairing code updates
export function usePairingCode(
  callback: (code: string) => void,
  deps: React.DependencyList = []
): void {
  const { socket, isConnected } = useSocket({ autoConnect: true });

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(EVENTS.PAIRING_CODE, callback);

    return () => {
      socket.off(EVENTS.PAIRING_CODE, callback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, ...deps]);
}

// =============================================================================
// Default Export
// =============================================================================

export default useSocket;
