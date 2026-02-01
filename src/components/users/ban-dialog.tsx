'use client';

/**
 * Ban Dialog Component
 * Confirmation dialog for banning a user
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ban, AlertTriangle } from 'lucide-react';
import type { User } from '@/types/database';

interface BanDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
}

export function BanDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: BanDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason || undefined);
    setReason('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('');
    }
    onOpenChange(newOpen);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Ban User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to ban this user? They will not be able to interact
            with the bot until unbanned.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted mb-4">
            <div className="flex-1">
              <p className="font-medium">{user.name || 'Unknown User'}</p>
              <p className="text-sm text-muted-foreground">
                {user.phone || user.jid.split('@')[0]}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{user.message_count} messages</p>
              <p>{user.command_count} commands</p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">This action can be reversed</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                You can unban this user later from the user details page.
              </p>
            </div>
          </div>

          {/* Ban Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Ban Reason (optional)</Label>
            <Input
              id="reason"
              placeholder="Enter a reason for the ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This will be recorded and shown in the user&apos;s profile.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Banning...
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Ban User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UnbanDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function UnbanDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: UnbanDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            Unban User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to unban this user? They will be able to interact
            with the bot again.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className="flex-1">
              <p className="font-medium">{user.name || 'Unknown User'}</p>
              <p className="text-sm text-muted-foreground">
                {user.phone || user.jid.split('@')[0]}
              </p>
            </div>
          </div>

          {/* Previous Ban Reason */}
          {user.ban_reason && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium text-muted-foreground">Previous Ban Reason</p>
              <p className="text-sm mt-1">{user.ban_reason}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Unbanning...' : 'Unban User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
