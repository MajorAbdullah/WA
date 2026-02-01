// Socket.IO Module Exports
// Central export file for all socket-related functionality

// Event types and constants
export * from './events';

// Server manager
export { socketManager, getSocketManager, createLogEntry, emitLog } from './server';

// Re-export types for convenience
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  BotState,
  BotStats,
  LogEntry,
  LogLevel,
  MessageStatus,
  MessageStatusUpdate,
  SendMessageData,
  SendMessageResponse,
  TypedServer,
  TypedSocket,
  TypedClientSocket,
  ConnectionStatus,
} from './events';
