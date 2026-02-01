'use client';

/**
 * User Table Component
 * Displays users in a sortable, filterable table
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Ban,
  UserCheck,
  MessageSquare,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { User } from '@/types/database';

interface UserTableProps {
  users: User[];
  onBan?: (user: User) => void;
  onUnban?: (user: User) => void;
  onDelete?: (user: User) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function getInitials(name: string | null, phone: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (phone) {
    return phone.slice(-2);
  }
  return '??';
}

export function UserTable({
  users,
  onBan,
  onUnban,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.jid)));
    }
  };

  const toggleSelect = (jid: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(jid)) {
      newSelected.delete(jid);
    } else {
      newSelected.add(jid);
    }
    setSelectedUsers(newSelected);
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => {
    const isActive = sortField === field;
    const Icon = isActive
      ? sortDirection === 'asc'
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;

    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => onSort?.(field)}
      >
        {children}
        <Icon className="ml-2 h-4 w-4" />
      </Button>
    );
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No users found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Users will appear here once they interact with the bot.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedUsers.size === users.length && users.length > 0}
                onChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>
              {onSort ? (
                <SortHeader field="message_count">Messages</SortHeader>
              ) : (
                'Messages'
              )}
            </TableHead>
            <TableHead>
              {onSort ? (
                <SortHeader field="command_count">Commands</SortHeader>
              ) : (
                'Commands'
              )}
            </TableHead>
            <TableHead>
              {onSort ? (
                <SortHeader field="last_seen">Last Seen</SortHeader>
              ) : (
                'Last Seen'
              )}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.jid}>
              <TableCell>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={selectedUsers.has(user.jid)}
                  onChange={() => toggleSelect(user.jid)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(user.name, user.phone)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/users/${encodeURIComponent(user.jid)}`}
                      className="font-medium hover:underline"
                    >
                      {user.name || 'Unknown User'}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {user.phone || user.jid.split('@')[0]}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="tabular-nums">{user.message_count}</span>
              </TableCell>
              <TableCell>
                <span className="tabular-nums">{user.command_count}</span>
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {formatTimestamp(user.last_seen)}
                </span>
              </TableCell>
              <TableCell>
                {user.is_banned ? (
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="h-3 w-3" />
                    Banned
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <UserCheck className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${encodeURIComponent(user.jid)}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/messages?jid=${encodeURIComponent(user.jid)}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.is_banned ? (
                      <DropdownMenuItem
                        onClick={() => onUnban?.(user)}
                        className="text-green-600"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Unban User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onBan?.(user)}
                        className="text-destructive"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Ban User
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete?.(user)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
