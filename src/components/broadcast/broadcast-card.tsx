'use client';

/**
 * Broadcast Card Component
 * Displays a single broadcast with status and actions
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
  Play,
  Ban,
  Eye,
  Calendar,
} from 'lucide-react';
import type { BroadcastWithMeta } from '@/hooks/use-broadcasts';

interface BroadcastCardProps {
  broadcast: BroadcastWithMeta;
  onSend?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

function formatTimestamp(timestamp: number | string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatRelativeTime(timestamp: number | string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 0) {
    // Future date
    const futureMins = Math.abs(diffMins);
    if (futureMins < 60) return `in ${futureMins}m`;
    const futureHours = Math.floor(futureMins / 60);
    if (futureHours < 24) return `in ${futureHours}h`;
    const futureDays = Math.floor(futureHours / 24);
    return `in ${futureDays}d`;
  }

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sending
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function BroadcastCard({
  broadcast,
  onSend,
  onCancel,
  showActions = true,
}: BroadcastCardProps) {
  const recipientCount = broadcast.recipientCount || broadcast.recipients.length;

  const progress =
    broadcast.status === 'in_progress' || broadcast.status === 'completed'
      ? {
          sent: broadcast.sent_count,
          failed: broadcast.failed_count,
          total: recipientCount,
          percentage:
            recipientCount > 0
              ? Math.round((broadcast.sent_count / recipientCount) * 100)
              : 0,
        }
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(broadcast.status)}
              {broadcast.scheduled_at && broadcast.status === 'pending' && (
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  Scheduled
                </Badge>
              )}
            </div>
            <p className="text-sm line-clamp-2">{broadcast.message}</p>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/broadcast/${broadcast.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {broadcast.status === 'pending' && (
                  <DropdownMenuItem onClick={onSend}>
                    <Play className="mr-2 h-4 w-4" />
                    Send Now
                  </DropdownMenuItem>
                )}
                {(broadcast.status === 'pending' ||
                  broadcast.status === 'in_progress') && (
                  <DropdownMenuItem
                    onClick={onCancel}
                    className="text-destructive"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Progress Bar */}
        {progress && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span className="text-green-600">{progress.sent} sent</span>
              {progress.failed > 0 && (
                <span className="text-destructive">{progress.failed} failed</span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipientCount} recipients</span>
          </div>
          <span title={formatTimestamp(broadcast.created_at)}>
            {broadcast.scheduled_at && broadcast.status === 'pending'
              ? `Scheduled: ${formatRelativeTime(broadcast.scheduled_at)}`
              : formatRelativeTime(broadcast.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
