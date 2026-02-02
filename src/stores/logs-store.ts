"use client";

import { create } from "zustand";
import type { LogEntry, LogLevel } from "@/lib/socket/events";

const MAX_LOGS = 1000;

interface LogsState {
  // Log entries
  logs: LogEntry[];

  // Filters
  levelFilter: LogLevel | "all";
  searchQuery: string;

  // UI state
  isPaused: boolean;
  autoScroll: boolean;

  // Actions
  addLog: (log: LogEntry) => void;
  addLogs: (logs: LogEntry[]) => void;
  clearLogs: () => void;
  setLevelFilter: (level: LogLevel | "all") => void;
  setSearchQuery: (query: string) => void;
  togglePause: () => void;
  setAutoScroll: (autoScroll: boolean) => void;

  // Computed
  getFilteredLogs: () => LogEntry[];
}

export const useLogsStore = create<LogsState>((set, get) => ({
  logs: [],
  levelFilter: "all",
  searchQuery: "",
  isPaused: false,
  autoScroll: true,

  addLog: (log) => {
    const { isPaused, logs } = get();
    if (isPaused) return;

    set({
      logs: [...logs, log].slice(-MAX_LOGS),
    });
  },

  addLogs: (newLogs) => {
    const { isPaused, logs } = get();
    if (isPaused) return;

    set({
      logs: [...logs, ...newLogs].slice(-MAX_LOGS),
    });
  },

  clearLogs: () => set({ logs: [] }),

  setLevelFilter: (level) => set({ levelFilter: level }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  setAutoScroll: (autoScroll) => set({ autoScroll }),

  getFilteredLogs: () => {
    const { logs, levelFilter, searchQuery } = get();

    return logs.filter((log) => {
      // Filter by level
      if (levelFilter !== "all" && log.level !== levelFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesMessage = log.message.toLowerCase().includes(query);
        const matchesMetadata = log.metadata
          ? JSON.stringify(log.metadata).toLowerCase().includes(query)
          : false;

        if (!matchesMessage && !matchesMetadata) {
          return false;
        }
      }

      return true;
    });
  },
}));

// Helper function to generate sample logs for testing
export function generateSampleLogs(count: number = 50): LogEntry[] {
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  const messages = [
    { level: "info", message: "Message received from +1234567890" },
    { level: "info", message: "Executing command: ping" },
    { level: "debug", message: "Response delay: 2340ms" },
    { level: "info", message: "Message sent to +1234567890" },
    { level: "warn", message: "Rate limit approaching for user" },
    { level: "error", message: "Failed to send message: timeout" },
    { level: "info", message: "New user registered: +0987654321" },
    { level: "debug", message: "Processing message queue" },
    { level: "info", message: "Bot connected successfully" },
    { level: "warn", message: "Connection unstable, retrying..." },
    { level: "error", message: "Database connection failed" },
    { level: "info", message: "Command executed: !help" },
    { level: "debug", message: "Cache hit for user data" },
    { level: "info", message: "Broadcast started: 50 recipients" },
    { level: "warn", message: "Memory usage above 80%" },
  ];

  const logs: LogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const sample = messages[Math.floor(Math.random() * messages.length)];
    logs.push({
      id: `log-${now}-${i}`,
      level: sample.level as LogLevel,
      message: sample.message,
      timestamp: now - (count - i) * 1000,
      metadata: Math.random() > 0.7 ? { extra: "data", index: i } : undefined,
    });
  }

  return logs;
}
