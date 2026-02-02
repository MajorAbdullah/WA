'use client';

/**
 * Settings Hook
 * Manages configuration state and API interactions
 */

import { useState, useCallback, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface BotConfig {
  name: string;
  prefix: string;
  owner: string;
  enableGroups: boolean;
  autoRead: boolean;
  showTyping: boolean;
}

export interface RateLimitConfig {
  perUser: number;
  perGroup: number;
  global: number;
  blockDuration: number;
}

export interface ResponseConfig {
  minDelay: number;
  maxDelay: number;
  typingSpeed: number;
}

export interface FullConfig {
  bot: BotConfig;
  rateLimit: RateLimitConfig;
  response: ResponseConfig;
}

interface UseSettingsReturn {
  config: FullConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateBotConfig: (updates: Partial<BotConfig>) => Promise<boolean>;
  updateRateLimitConfig: (updates: Partial<RateLimitConfig>) => Promise<boolean>;
  updateResponseConfig: (updates: Partial<ResponseConfig>) => Promise<boolean>;
  resetConfig: (section?: 'bot' | 'rateLimit' | 'response' | 'all') => Promise<boolean>;
}

// =============================================================================
// Default Values
// =============================================================================

const defaultConfig: FullConfig = {
  bot: {
    name: 'WhatsApp Bot',
    prefix: '!',
    owner: '',
    enableGroups: true,
    autoRead: false,
    showTyping: true,
  },
  rateLimit: {
    perUser: 30,
    perGroup: 60,
    global: 300,
    blockDuration: 60,
  },
  response: {
    minDelay: 500,
    maxDelay: 2000,
    typingSpeed: 50,
  },
};

// =============================================================================
// Hook
// =============================================================================

export function useSettings(): UseSettingsReturn {
  const [config, setConfig] = useState<FullConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/config');
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        setError(data.error || 'Failed to fetch configuration');
        setConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
      setError('Failed to fetch configuration');
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update bot configuration
  const updateBotConfig = useCallback(async (updates: Partial<BotConfig>): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot: updates }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        return true;
      } else {
        setError(data.error || 'Failed to update configuration');
        return false;
      }
    } catch (err) {
      console.error('Error updating bot config:', err);
      setError('Failed to update configuration');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Update rate limit configuration
  const updateRateLimitConfig = useCallback(async (updates: Partial<RateLimitConfig>): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateLimit: updates }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        return true;
      } else {
        setError(data.error || 'Failed to update configuration');
        return false;
      }
    } catch (err) {
      console.error('Error updating rate limit config:', err);
      setError('Failed to update configuration');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Update response configuration
  const updateResponseConfig = useCallback(async (updates: Partial<ResponseConfig>): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: updates }),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        return true;
      } else {
        setError(data.error || 'Failed to update configuration');
        return false;
      }
    } catch (err) {
      console.error('Error updating response config:', err);
      setError('Failed to update configuration');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Reset configuration
  const resetConfig = useCallback(async (section: 'bot' | 'rateLimit' | 'response' | 'all' = 'all'): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/config/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section }),
      });

      const data = await response.json();

      if (data.success) {
        // Refetch to get updated config
        await fetchConfig();
        return true;
      } else {
        setError(data.error || 'Failed to reset configuration');
        return false;
      }
    } catch (err) {
      console.error('Error resetting config:', err);
      setError('Failed to reset configuration');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchConfig]);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    saving,
    error,
    fetchConfig,
    updateBotConfig,
    updateRateLimitConfig,
    updateResponseConfig,
    resetConfig,
  };
}

export default useSettings;
