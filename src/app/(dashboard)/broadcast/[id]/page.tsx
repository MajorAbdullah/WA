'use client';

/**
 * Broadcast Details Page
 * View detailed information about a specific broadcast
 */

import { useState, use } from 'react';
import Link from 'next/link';
import { useBroadcastDetails } from '@/hooks/use-broadcasts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Radio,
  RefreshCw,
  Play,
  Ban,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatTimestamp(timestamp: number | string): string {
  return new Date(timestamp).toLocaleString();
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

export default function BroadcastDetailsPage({ params }: PageProps) {
  const { id } = use(params);

  const {
    broadcast,
    loading,
    error,
    refetch,
    sendBroadcast,
    cancelBroadcast,
  } = useBroadcastDetails(id);

  const [confirmAction, setConfirmAction] = useState<'send' | 'cancel' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSend = async () => {
    setActionLoading(true);
    const success = await sendBroadcast();
    setActionLoading(false);

    if (success) {
      setConfirmAction(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    const success = await cancelBroadcast();
    setActionLoading(false);

    if (success) {
      setConfirmAction(null);
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
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !broadcast) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/broadcast">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Broadcast Details</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" asChild>
                <Link href="/broadcast">Back to Broadcasts</Link>
              </Button>
              <Button variant="outline" onClick={refetch}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!broadcast) {
    return null;
  }

  const recipientCount = broadcast.recipientCount || broadcast.recipients.length;
  const progress = {
    sent: broadcast.sent_count,
    failed: broadcast.failed_count,
    total: recipientCount,
    remaining: recipientCount - broadcast.sent_count - broadcast.failed_count,
    percentage:
      recipientCount > 0
        ? Math.round((broadcast.sent_count / recipientCount) * 100)
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/broadcast">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Radio className="h-6 w-6" />
                Broadcast
              </h1>
              {getStatusBadge(broadcast.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              Created {formatTimestamp(broadcast.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {broadcast.status === 'pending' && (
            <Button onClick={() => setConfirmAction('send')}>
              <Play className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          )}
          {(broadcast.status === 'pending' || broadcast.status === 'in_progress') && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setConfirmAction('cancel')}
            >
              <Ban className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted whitespace-pre-wrap">
                {broadcast.message}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold">{recipientCount}</p>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
              </div>

              {/* Progress */}
              {(broadcast.status === 'in_progress' || broadcast.status === 'completed') && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{progress.percentage}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-lg font-bold text-green-600">{progress.sent}</p>
                      <p className="text-xs text-green-600">Sent</p>
                    </div>
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-lg font-bold text-red-600">{progress.failed}</p>
                      <p className="text-xs text-red-600">Failed</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted">
                      <p className="text-lg font-bold">{progress.remaining}</p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Info */}
          {broadcast.scheduled_at && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {broadcast.status === 'pending'
                    ? 'Scheduled for'
                    : 'Was scheduled for'}
                </p>
                <p className="font-medium mt-1">
                  {formatTimestamp(broadcast.scheduled_at)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'send' ? 'Send Broadcast' : 'Cancel Broadcast'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'send'
                ? `Are you sure you want to send this broadcast to ${recipientCount} recipients?`
                : 'Are you sure you want to cancel this broadcast?'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Close
            </Button>
            {confirmAction === 'send' ? (
              <Button onClick={handleSend} disabled={actionLoading}>
                {actionLoading ? 'Sending...' : 'Send Now'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Broadcast'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
