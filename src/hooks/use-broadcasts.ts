'use client';

/**
 * useBroadcasts Hook
 * Manages broadcast data fetching and operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { Broadcast } from '@/types/database';

export interface BroadcastWithMeta extends Omit<Broadcast, 'recipients'> {
  recipientCount: number;
  recipients: string[];
}

interface UseBroadcastsOptions {
  page?: number;
  limit?: number;
  status?: string;
}

interface BroadcastsResponse {
  broadcasts: BroadcastWithMeta[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export function useBroadcasts(options: UseBroadcastsOptions = {}) {
  const [broadcasts, setBroadcasts] = useState<BroadcastWithMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { page = 1, limit = 20, status } = options;

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (status) params.set('status', status);

      const response = await fetch(`/api/broadcast?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch broadcasts');
      }

      const data: BroadcastsResponse = await response.json();

      setBroadcasts(data.broadcasts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const sendBroadcast = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/broadcast/${id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send broadcast');
      }

      // Refresh broadcasts list
      await fetchBroadcasts();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast');
      return false;
    }
  };

  const cancelBroadcast = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/broadcast/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel broadcast');
      }

      // Refresh broadcasts list
      await fetchBroadcasts();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel broadcast');
      return false;
    }
  };

  return {
    broadcasts,
    total,
    totalPages,
    stats,
    loading,
    error,
    refetch: fetchBroadcasts,
    sendBroadcast,
    cancelBroadcast,
  };
}

export function useBroadcastDetails(id: string | null) {
  const [broadcast, setBroadcast] = useState<BroadcastWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBroadcast = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/broadcast/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Broadcast not found');
        }
        throw new Error('Failed to fetch broadcast');
      }

      const data = await response.json();
      setBroadcast(data.broadcast);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBroadcast();
  }, [fetchBroadcast]);

  // Poll for updates if broadcast is in progress
  useEffect(() => {
    if (!broadcast || broadcast.status !== 'in_progress') return;

    const interval = setInterval(fetchBroadcast, 3000);
    return () => clearInterval(interval);
  }, [broadcast?.status, fetchBroadcast]);

  const sendBroadcast = async (): Promise<boolean> => {
    if (!id) return false;

    try {
      const response = await fetch(`/api/broadcast/${id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send broadcast');
      }

      await fetchBroadcast();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast');
      return false;
    }
  };

  const cancelBroadcast = async (): Promise<boolean> => {
    if (!id) return false;

    try {
      const response = await fetch(`/api/broadcast/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel broadcast');
      }

      await fetchBroadcast();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel broadcast');
      return false;
    }
  };

  return {
    broadcast,
    loading,
    error,
    refetch: fetchBroadcast,
    sendBroadcast,
    cancelBroadcast,
  };
}
