'use client';

/**
 * Groups List Page
 * Displays all groups the bot is a member of
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  RefreshCw,
  MoreHorizontal,
  Eye,
  LogOut,
  MessageSquare,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  owner?: string;
  creation?: number;
  participantCount: number;
  description?: string | null;
  announce: boolean;
  restrict: boolean;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [leaveDialogGroup, setLeaveDialogGroup] = useState<Group | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/groups');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch groups');
      }

      setGroups(data.groups || []);
      setFilteredGroups(data.groups || []);

      if (data.message && data.groups?.length === 0) {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Filter groups by search
  useEffect(() => {
    if (!search) {
      setFilteredGroups(groups);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredGroups(
        groups.filter(
          (g) =>
            g.name.toLowerCase().includes(searchLower) ||
            g.id.includes(searchLower)
        )
      );
    }
  }, [search, groups]);

  const handleLeaveGroup = async () => {
    if (!leaveDialogGroup) return;

    setLeaveLoading(true);
    try {
      const response = await fetch(
        `/api/groups/${encodeURIComponent(leaveDialogGroup.id)}/leave`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to leave group');
      }

      // Remove from list
      setGroups((prev) => prev.filter((g) => g.id !== leaveDialogGroup.id));
      setLeaveDialogGroup(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage groups the bot is a member of
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchGroups} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
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
                  <p className="text-2xl font-bold">{groups.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {groups.filter((g) => g.announce).length}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Announcement Only</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {groups.filter((g) => g.restrict).length}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Restricted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(5)].map((_, i) => (
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
      )}

      {/* Groups Table */}
      {!loading && filteredGroups.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/groups/${encodeURIComponent(group.id)}`}
                        className="font-medium hover:underline"
                      >
                        {group.name}
                      </Link>
                      {group.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">{group.participantCount}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {group.announce && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Lock className="h-3 w-3" />
                          Announce
                        </Badge>
                      )}
                      {group.restrict && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Shield className="h-3 w-3" />
                          Restricted
                        </Badge>
                      )}
                      {!group.announce && !group.restrict && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Unlock className="h-3 w-3" />
                          Open
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/groups/${encodeURIComponent(group.id)}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/messages?jid=${encodeURIComponent(group.id)}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            View Messages
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setLeaveDialogGroup(group)}
                          className="text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGroups.length === 0 && groups.length === 0 && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No groups found</h3>
              <p className="text-muted-foreground mt-1">
                The bot is not a member of any groups yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No search results */}
      {!loading && filteredGroups.length === 0 && groups.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-muted-foreground mt-1">
                No groups match your search criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Group Dialog */}
      <Dialog
        open={!!leaveDialogGroup}
        onOpenChange={(open) => !open && setLeaveDialogGroup(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Leave Group
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this group? The bot will no longer be able
              to receive or send messages in this group.
            </DialogDescription>
          </DialogHeader>

          {leaveDialogGroup && (
            <div className="py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{leaveDialogGroup.name}</p>
                <p className="text-sm text-muted-foreground">
                  {leaveDialogGroup.participantCount} members
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveDialogGroup(null)}
              disabled={leaveLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveGroup}
              disabled={leaveLoading}
            >
              {leaveLoading ? 'Leaving...' : 'Leave Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
