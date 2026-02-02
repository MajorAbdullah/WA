'use client';

/**
 * Broadcast List Page
 * Displays all broadcasts with status and actions
 */

import { useState } from 'react';
import Link from 'next/link';
import { useBroadcasts, type BroadcastWithMeta } from '@/hooks/use-broadcasts';
import { BroadcastCard } from '@/components/broadcast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Radio,
  Plus,
  RefreshCw,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export default function BroadcastPage() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'send' | 'cancel';
    broadcast: BroadcastWithMeta;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const status = tab === 'all' ? undefined : tab;

  const {
    broadcasts,
    total,
    totalPages,
    stats,
    loading,
    error,
    refetch,
    sendBroadcast,
    cancelBroadcast,
  } = useBroadcasts({ page, status });

  const handleSend = async () => {
    if (!confirmAction || confirmAction.type !== 'send') return;

    setActionLoading(true);
    const success = await sendBroadcast(confirmAction.broadcast.id);
    setActionLoading(false);

    if (success) {
      setConfirmAction(null);
    }
  };

  const handleCancel = async () => {
    if (!confirmAction || confirmAction.type !== 'cancel') return;

    setActionLoading(true);
    const success = await cancelBroadcast(confirmAction.broadcast.id);
    setActionLoading(false);

    if (success) {
      setConfirmAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6" />
            Broadcast Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Send messages to multiple users at once
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/broadcast/new">
              <Plus className="h-4 w-4 mr-2" />
              New Broadcast
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.pending}</p>
                )}
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                )}
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.completed}</p>
                )}
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                )}
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && broadcasts.length === 0 && (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Broadcasts List */}
      {!loading && broadcasts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No broadcasts yet</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Create your first broadcast to send messages to multiple users.
              </p>
              <Button asChild>
                <Link href="/broadcast/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Broadcast
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {broadcasts.length > 0 && (
        <div className="grid gap-4">
          {broadcasts.map((broadcast) => (
            <BroadcastCard
              key={broadcast.id}
              broadcast={broadcast}
              onSend={() =>
                setConfirmAction({ type: 'send', broadcast })
              }
              onCancel={() =>
                setConfirmAction({ type: 'cancel', broadcast })
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
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
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'send' ? 'Send Broadcast' : 'Cancel Broadcast'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'send'
                ? 'Are you sure you want to send this broadcast now?'
                : 'Are you sure you want to cancel this broadcast?'}
            </DialogDescription>
          </DialogHeader>

          {confirmAction && (
            <div className="py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm line-clamp-2">{confirmAction.broadcast.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {confirmAction.broadcast.recipientCount || confirmAction.broadcast.recipients.length}{' '}
                  recipients
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            {confirmAction?.type === 'send' ? (
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
