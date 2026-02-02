'use client';

/**
 * Broadcast Form Component
 * Form for creating a new broadcast
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Send,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

type RecipientType = 'all' | 'groups' | 'custom';

interface BroadcastFormProps {
  onSuccess?: () => void;
}

export function BroadcastForm({ onSuccess }: BroadcastFormProps) {
  const router = useRouter();

  // Form state
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Stats
  const [userCount, setUserCount] = useState<number | null>(null);
  const [groupCount, setGroupCount] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      try {
        // Fetch user count
        const usersRes = await fetch('/api/users?limit=1');
        const usersData = await usersRes.json();
        setUserCount(usersData.stats?.activeUsers || 0);

        // Fetch group count
        const groupsRes = await fetch('/api/groups');
        const groupsData = await groupsRes.json();
        setGroupCount(groupsData.total || 0);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoadingStats(false);
      }
    }

    fetchStats();
  }, []);

  // Get recipient count for display
  const getRecipientCount = () => {
    switch (recipientType) {
      case 'all':
        return userCount ?? 0;
      case 'groups':
        return groupCount ?? 0;
      case 'custom':
        return 0; // Would need custom selection UI
      default:
        return 0;
    }
  };

  // Validate form
  const isValid = () => {
    if (!message.trim()) return false;
    if (getRecipientCount() === 0) return false;
    if (scheduleType === 'later' && (!scheduledDate || !scheduledTime)) return false;
    return true;
  };

  // Get scheduled timestamp
  const getScheduledAt = (): string | null => {
    if (scheduleType === 'now') return null;
    if (!scheduledDate || !scheduledTime) return null;
    return new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isValid()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          recipientType,
          scheduledAt: getScheduledAt(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create broadcast');
      }

      // If sending now, trigger the send
      if (scheduleType === 'now') {
        const sendResponse = await fetch(`/api/broadcast/${data.broadcast.id}/send`, {
          method: 'POST',
        });

        if (!sendResponse.ok) {
          const sendData = await sendResponse.json();
          throw new Error(sendData.error || 'Failed to start broadcast');
        }
      }

      setConfirmDialogOpen(false);
      toast.success(
        scheduleType === 'now'
          ? 'Broadcast started successfully'
          : 'Broadcast scheduled successfully'
      );
      onSuccess?.();
      router.push('/broadcast');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="message">Broadcast Message</Label>
            <textarea
              id="message"
              className="mt-1.5 w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter your broadcast message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} characters
            </p>
          </div>

          {/* Message Preview */}
          {message.trim() && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
              <div className="p-3 rounded-lg bg-primary/10 text-sm whitespace-pre-wrap">
                {message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="recipientType"
                value="all"
                checked={recipientType === 'all'}
                onChange={() => setRecipientType('all')}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="font-medium">All Active Users</p>
                <p className="text-sm text-muted-foreground">
                  Send to all users who are not banned
                </p>
              </div>
              {loadingStats ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Badge variant="secondary">{userCount}</Badge>
              )}
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="recipientType"
                value="groups"
                checked={recipientType === 'groups'}
                onChange={() => setRecipientType('groups')}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="font-medium">Groups Only</p>
                <p className="text-sm text-muted-foreground">
                  Send to all groups the bot is in
                </p>
              </div>
              {loadingStats ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                <Badge variant="secondary">{groupCount}</Badge>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="scheduleType"
                value="now"
                checked={scheduleType === 'now'}
                onChange={() => setScheduleType('now')}
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium">Send Now</p>
                <p className="text-sm text-muted-foreground">
                  Start sending immediately
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                name="scheduleType"
                value="later"
                checked={scheduleType === 'later'}
                onChange={() => setScheduleType('later')}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <p className="font-medium">Schedule for Later</p>
                <p className="text-sm text-muted-foreground">
                  Pick a date and time
                </p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </label>
          </div>

          {scheduleType === 'later' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={() => setConfirmDialogOpen(true)}
          disabled={!isValid() || submitting}
        >
          <Send className="h-4 w-4 mr-2" />
          {scheduleType === 'now' ? 'Send Broadcast' : 'Schedule Broadcast'}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Broadcast</DialogTitle>
            <DialogDescription>
              {scheduleType === 'now'
                ? 'Are you sure you want to send this broadcast now?'
                : 'Are you sure you want to schedule this broadcast?'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-1">Message</p>
              <p className="text-sm whitespace-pre-wrap line-clamp-3">{message}</p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recipients</span>
              <span className="font-medium">{getRecipientCount()}</span>
            </div>

            {scheduleType === 'later' && scheduledDate && scheduledTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scheduled for</span>
                <span className="font-medium">
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>Sending...</>
              ) : scheduleType === 'now' ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
