'use client';

/**
 * User Card Component
 * Displays user information in a card format
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Ban,
  UserCheck,
  MessageSquare,
  Terminal,
  Clock,
  Calendar,
  Phone,
} from 'lucide-react';
import type { User } from '@/types/database';

interface UserCardProps {
  user: User;
  onBan?: () => void;
  onUnban?: () => void;
  showActions?: boolean;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatRelativeTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

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

export function UserCard({ user, onBan, onUnban, showActions = true }: UserCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(user.name, user.phone)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">
                {user.name || 'Unknown User'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{user.phone || user.jid.split('@')[0]}</span>
              </div>
            </div>
          </div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-md bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{user.message_count}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-md bg-primary/10">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{user.command_count}</p>
              <p className="text-xs text-muted-foreground">Commands</p>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last seen</span>
            </div>
            <span title={formatTimestamp(user.last_seen)}>
              {formatRelativeTime(user.last_seen)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>First seen</span>
            </div>
            <span title={formatTimestamp(user.first_seen)}>
              {formatRelativeTime(user.first_seen)}
            </span>
          </div>
        </div>

        {/* Ban Reason */}
        {user.is_banned && user.ban_reason && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive">Ban Reason</p>
            <p className="text-sm text-destructive/80 mt-1">{user.ban_reason}</p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {user.is_banned ? (
              <Button
                variant="outline"
                className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={onUnban}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Unban User
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onBan}
              >
                <Ban className="mr-2 h-4 w-4" />
                Ban User
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
