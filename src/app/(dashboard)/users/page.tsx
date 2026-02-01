'use client';

/**
 * Users List Page
 * Displays all users with filtering, sorting, and actions
 */

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserTable, BanDialog, UnbanDialog } from '@/components/users';
import { useUsers } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Search,
  RefreshCw,
  Ban,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import type { User } from '@/types/database';

function UsersPageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersPageLoading />}>
      <UsersPageContent />
    </Suspense>
  );
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const page = parseInt(searchParams.get('page') || '1', 10);
  const tab = searchParams.get('tab') || 'all';
  const searchQuery = searchParams.get('search') || '';

  // Local state
  const [search, setSearch] = useState(searchQuery);
  const [banDialogUser, setBanDialogUser] = useState<User | null>(null);
  const [unbanDialogUser, setUnbanDialogUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [sortField, setSortField] = useState<string>('last_seen');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Determine banned filter from tab
  const banned = tab === 'banned' ? true : tab === 'active' ? false : undefined;

  // Fetch users
  const {
    users,
    total,
    totalPages,
    stats,
    loading,
    error,
    refetch,
    banUser,
    unbanUser,
    deleteUser,
  } = useUsers({
    page,
    limit: 20,
    search: searchQuery || undefined,
    banned,
  });

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.push(`/users?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: search || null, page: '1' });
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    updateParams({ tab: value === 'all' ? null : value, page: '1' });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    // Note: Sorting is done client-side for now
    // For large datasets, this should be done server-side
  };

  // Handle ban
  const handleBan = async (reason?: string) => {
    if (!banDialogUser) return;

    setActionLoading(true);
    const success = await banUser(banDialogUser.jid, reason);
    setActionLoading(false);

    if (success) {
      setBanDialogUser(null);
    }
  };

  // Handle unban
  const handleUnban = async () => {
    if (!unbanDialogUser) return;

    setActionLoading(true);
    const success = await unbanUser(unbanDialogUser.jid);
    setActionLoading(false);

    if (success) {
      setUnbanDialogUser(null);
    }
  };

  // Handle delete
  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name || user.phone || 'this user'}?`)) {
      return;
    }

    await deleteUser(user.jid);
  };

  // Sort users client-side
  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField as keyof User];
    const bValue = b[sortField as keyof User];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  // Export to CSV
  const handleExport = () => {
    const headers = ['Name', 'Phone', 'Messages', 'Commands', 'Status', 'Last Seen'];
    const rows = users.map((u) => [
      u.name || '',
      u.phone || u.jid.split('@')[0],
      u.message_count,
      u.command_count,
      u.is_banned ? 'Banned' : 'Active',
      new Date(u.last_seen).toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users who have interacted with the bot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                )}
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats.bannedUsers}</p>
                )}
                <p className="text-sm text-muted-foreground">Banned Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="banned">Banned</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !users.length && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {!loading || users.length > 0 ? (
        <UserTable
          users={sortedUsers}
          onBan={(user) => setBanDialogUser(user)}
          onUnban={(user) => setUnbanDialogUser(user)}
          onDelete={handleDelete}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Ban Dialog */}
      <BanDialog
        user={banDialogUser}
        open={!!banDialogUser}
        onOpenChange={(open) => !open && setBanDialogUser(null)}
        onConfirm={handleBan}
        loading={actionLoading}
      />

      {/* Unban Dialog */}
      <UnbanDialog
        user={unbanDialogUser}
        open={!!unbanDialogUser}
        onOpenChange={(open) => !open && setUnbanDialogUser(null)}
        onConfirm={handleUnban}
        loading={actionLoading}
      />
    </div>
  );
}
