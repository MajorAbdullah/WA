'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from './use-socket';
import { useBotStore } from '@/stores/bot-store';
import type { BotState } from '@/lib/socket/events';

// =============================================================================
// Hook Return Type
// =============================================================================

interface UseBotStatusReturn {
  // State
  botState: BotState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  qrCode: string | null;
  pairingCode: string | null;
  phoneNumber: string | null;
  uptime: number;

  // Actions
  connect: (options?: { usePairingCode?: boolean; phoneNumber?: string }) => void;
  disconnect: () => void;
  refresh: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useBotStatus(): UseBotStatusReturn {
  const { botState: socketBotState, connectBot, disconnectBot, requestBotStatus } = useSocket();
  const { botState, setBotState, updateBotState, addConnectionActivity } = useBotStore();

  // Sync socket state to store
  useEffect(() => {
    if (socketBotState) {
      const prevStatus = botState.status;
      setBotState(socketBotState);

      // Track connection state changes for activity feed
      if (prevStatus !== socketBotState.status) {
        if (socketBotState.status === 'connected') {
          addConnectionActivity(true, socketBotState.phoneNumber || undefined);
        } else if (socketBotState.status === 'disconnected' && prevStatus === 'connected') {
          addConnectionActivity(false);
        }
      }
    }
  }, [socketBotState, setBotState, botState.status, addConnectionActivity]);

  // Connect action
  const connect = useCallback((options?: { usePairingCode?: boolean; phoneNumber?: string }) => {
    updateBotState({ status: 'connecting' });
    connectBot(options);
  }, [connectBot, updateBotState]);

  // Disconnect action
  const disconnect = useCallback(() => {
    disconnectBot();
  }, [disconnectBot]);

  // Refresh status
  const refresh = useCallback(() => {
    requestBotStatus();
  }, [requestBotStatus]);

  return {
    botState,
    isConnected: botState.status === 'connected',
    isConnecting: botState.status === 'connecting',
    isDisconnected: botState.status === 'disconnected',
    qrCode: botState.qrCode,
    pairingCode: botState.pairingCode,
    phoneNumber: botState.phoneNumber,
    uptime: botState.uptime,
    connect,
    disconnect,
    refresh,
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

// Hook for just the connection status
export function useConnectionStatus() {
  const { botState } = useBotStore();
  return botState.status;
}

// Hook for QR code only
export function useQRCode() {
  const { botState } = useBotStore();
  return botState.qrCode;
}

// Hook for pairing code only
export function usePairingCodeStatus() {
  const { botState } = useBotStore();
  return botState.pairingCode;
}

export default useBotStatus;
