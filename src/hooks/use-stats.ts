'use client';

import { useEffect, useMemo } from 'react';
import { useSocket } from './use-socket';
import { useBotStore, selectTotalMessages } from '@/stores/bot-store';
import type { BotStats } from '@/lib/socket/events';

// =============================================================================
// Types
// =============================================================================

interface UseStatsReturn {
  stats: BotStats;
  totalMessages: number;
  formattedUptime: string;
  isLoading: boolean;
  refresh: () => void;
}

// =============================================================================
// Utility Functions
// =============================================================================

export function formatUptime(ms: number): string {
  if (ms === 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// =============================================================================
// Hook
// =============================================================================

export function useStats(): UseStatsReturn {
  const { botStats: socketStats, requestStats, isConnected } = useSocket();
  const { botStats, setBotStats, botState } = useBotStore();

  // Sync socket stats to store
  useEffect(() => {
    if (socketStats) {
      setBotStats(socketStats);
    }
  }, [socketStats, setBotStats]);

  // Calculate total messages
  const totalMessages = useMemo(() => {
    return botStats.messagesReceived + botStats.messagesSent;
  }, [botStats.messagesReceived, botStats.messagesSent]);

  // Format uptime
  const formattedUptime = useMemo(() => {
    return formatUptime(botStats.uptime);
  }, [botStats.uptime]);

  return {
    stats: botStats,
    totalMessages,
    formattedUptime,
    isLoading: !isConnected,
    refresh: requestStats,
  };
}

// =============================================================================
// Specific Stat Hooks
// =============================================================================

export function useMessageStats() {
  const { botStats } = useBotStore();
  return {
    received: botStats.messagesReceived,
    sent: botStats.messagesSent,
    total: botStats.messagesReceived + botStats.messagesSent,
  };
}

export function useUserStats() {
  const { botStats } = useBotStore();
  return {
    total: botStats.totalUsers,
    activeChats: botStats.activeChats,
  };
}

export function useCommandStats() {
  const { botStats } = useBotStore();
  return {
    executed: botStats.commandsExecuted,
    errors: botStats.errors,
  };
}

export function useUptimeStats() {
  const { botStats } = useBotStore();
  return {
    uptime: botStats.uptime,
    formatted: formatUptime(botStats.uptime),
  };
}

export default useStats;
