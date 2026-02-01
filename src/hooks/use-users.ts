'use client';

/**
 * useUsers Hook
 * Manages user data fetching and operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/database';

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  banned?: boolean;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalUsers: number;
    bannedUsers: number;
    activeUsers: number;
  };
}

interface UserDetailsResponse {
  user: User;
  recentMessages: unknown[];
  commandHistory: unknown[];
  stats: {
    totalMessages: number;
    totalCommands: number;
  };
}

export function useUsers(options: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    bannedUsers: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { page = 1, limit = 20, search, banned } = options;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      if (banned !== undefined) params.set('banned', banned.toString());

      const response = await fetch(`/api/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UsersResponse = await response.json();

      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, banned]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const banUser = async (jid: string, reason?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(jid)}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to ban user');
      }

      // Refresh users list
      await fetchUsers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
      return false;
    }
  };

  const unbanUser = async (jid: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(jid)}/ban`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unban user');
      }

      // Refresh users list
      await fetchUsers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user');
      return false;
    }
  };

  const deleteUser = async (jid: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(jid)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Refresh users list
      await fetchUsers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      return false;
    }
  };

  return {
    users,
    total,
    totalPages,
    stats,
    loading,
    error,
    refetch: fetchUsers,
    banUser,
    unbanUser,
    deleteUser,
  };
}

export function useUserDetails(jid: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [recentMessages, setRecentMessages] = useState<unknown[]>([]);
  const [commandHistory, setCommandHistory] = useState<unknown[]>([]);
  const [stats, setStats] = useState({ totalMessages: 0, totalCommands: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = useCallback(async () => {
    if (!jid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(jid)}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user details');
      }

      const data: UserDetailsResponse = await response.json();

      setUser(data.user);
      setRecentMessages(data.recentMessages);
      setCommandHistory(data.commandHistory);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [jid]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const banUser = async (reason?: string): Promise<boolean> => {
    if (!jid) return false;

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(jid)}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to ban user');
      }

      // Refresh user details
      await fetchUserDetails();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
      return false;
    }
  };

  const unbanUser = async (): Promise<boolean> => {
    if (!jid) return false;

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(jid)}/ban`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unban user');
      }

      // Refresh user details
      await fetchUserDetails();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user');
      return false;
    }
  };

  return {
    user,
    recentMessages,
    commandHistory,
    stats,
    loading,
    error,
    refetch: fetchUserDetails,
    banUser,
    unbanUser,
  };
}
