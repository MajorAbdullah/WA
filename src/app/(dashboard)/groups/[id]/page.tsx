'use client';

/**
 * Group Details Page
 * Displays detailed information about a specific group
 */

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Shield,
  Crown,
  User,
  Search,
  RefreshCw,
  MessageSquare,
  LogOut,
  Lock,
  Unlock,
  Calendar,
  Ban,
} from 'lucide-react';

interface GroupMember {
  jid: string;
  phone: string;
  name: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  messageCount: number;
  commandCount: number;
  isBanned: boolean;
  lastSeen: number | null;
}

interface GroupDetails {
  id: string;
  name: string;
  owner?: string;
  creation?: number;
  description?: string | null;
  participants: { jid: string; isAdmin: boolean; isSuperAdmin: boolean }[];
  participantCount: number;
  admins: string[];
  adminCount: number;
  announce: boolean;
  restrict: boolean;
  ephemeral?: number | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return phone.slice(-2);
}

export default function GroupDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const groupId = decodeURIComponent(id);

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const fetchGroupDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch group details
      const groupRes = await fetch(`/api/groups/${encodeURIComponent(groupId)}`);
      const groupData = await groupRes.json();

      if (!groupRes.ok) {
        throw new Error(groupData.error || 'Failed to fetch group details');
      }

      setGroup(groupData.group);

      // Fetch members
      const membersRes = await fetch(
        `/api/groups/${encodeURIComponent(groupId)}/members`
      );
      const membersData = await membersRes.json();

      if (membersRes.ok) {
        setMembers(membersData.members || []);
        setFilteredMembers(membersData.members || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  // Filter members by search
  useEffect(() => {
    if (!search) {
      setFilteredMembers(members);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredMembers(
        members.filter(
          (m) =>
            m.name?.toLowerCase().includes(searchLower) ||
            m.phone.includes(searchLower) ||
            m.jid.includes(searchLower)
        )
      );
    }
  }, [search, members]);

  const handleLeaveGroup = async () => {
    setLeaveLoading(true);
    try {
      const response = await fetch(
        `/api/groups/${encodeURIComponent(groupId)}/leave`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to leave group');
      }

      // Redirect to groups list
      window.location.href = '/groups';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group');
      setLeaveLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !group) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/groups">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Group Details</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" asChild>
                <Link href="/groups">Back to Groups</Link>
              </Button>
              <Button variant="outline" onClick={fetchGroupDetails}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/groups">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">
              {group.participantCount} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchGroupDetails}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setLeaveDialogOpen(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Group
          </Button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-amber-700 dark:text-amber-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Group Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            {group.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Description
                </p>
                <p className="text-sm mt-1">{group.description}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Members</span>
                </div>
                <p className="text-xl font-bold mt-1">{group.participantCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Admins</span>
                </div>
                <p className="text-xl font-bold mt-1">{group.adminCount}</p>
              </div>
            </div>

            {/* Properties */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Messages</span>
                <Badge
                  variant={group.announce ? 'secondary' : 'outline'}
                  className="gap-1"
                >
                  {group.announce ? (
                    <>
                      <Lock className="h-3 w-3" /> Admins Only
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" /> Everyone
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Edit Info</span>
                <Badge
                  variant={group.restrict ? 'secondary' : 'outline'}
                  className="gap-1"
                >
                  {group.restrict ? (
                    <>
                      <Shield className="h-3 w-3" /> Admins Only
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" /> Everyone
                    </>
                  )}
                </Badge>
              </div>
              {group.creation && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatTimestamp(group.creation)}
                  </span>
                </div>
              )}
            </div>

            {/* View Messages Button */}
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/messages?jid=${encodeURIComponent(groupId)}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                View Messages
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Members List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Members</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No members found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Messages</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.jid}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(member.name, member.phone)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <Link
                                  href={`/users/${encodeURIComponent(member.jid)}`}
                                  className="font-medium hover:underline"
                                >
                                  {member.name || 'Unknown'}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                  {member.phone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.isSuperAdmin ? (
                              <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                <Crown className="h-3 w-3" />
                                Owner
                              </Badge>
                            ) : member.isAdmin ? (
                              <Badge
                                variant="secondary"
                                className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              >
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <User className="h-3 w-3" />
                                Member
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="tabular-nums text-sm">
                              {member.messageCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            {member.isBanned ? (
                              <Badge variant="destructive" className="gap-1">
                                <Ban className="h-3 w-3" />
                                Banned
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              >
                                Active
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave Group Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
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

          <div className="py-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">{group.name}</p>
              <p className="text-sm text-muted-foreground">
                {group.participantCount} members
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveDialogOpen(false)}
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
