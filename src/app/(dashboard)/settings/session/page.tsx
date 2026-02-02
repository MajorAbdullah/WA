'use client';

/**
 * Session Management Settings Page
 * Manage WhatsApp connection and session data
 */

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Smartphone,
  ArrowLeft,
  LogOut,
  Download,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useBotStatus } from '@/hooks/use-bot-status';
import { formatUptime } from '@/hooks/use-stats';
import { toast } from 'sonner';

// =============================================================================
// Session Info Card Component
// =============================================================================

interface SessionInfoProps {
  label: string;
  value: string;
  icon: typeof Phone;
}

function SessionInfo({ label, value, icon: Icon }: SessionInfoProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function SessionSettingsPage() {
  const {
    botState,
    isConnected,
    isConnecting,
    phoneNumber,
    uptime,
    connect,
    disconnect,
    refresh,
  } = useBotStatus();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Handle disconnect/logout
  const handleLogout = async () => {
    if (!confirm('Are you sure you want to disconnect? You will need to scan the QR code again to reconnect.')) {
      return;
    }

    setActionLoading('logout');
    try {
      disconnect();
      toast.success('Disconnected from WhatsApp');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle session backup (placeholder)
  const handleBackup = async () => {
    setActionLoading('backup');
    try {
      // This would typically call an API to backup the session
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.info('Session backup feature coming soon!');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle clear session (placeholder)
  const handleClearSession = async () => {
    if (!confirm('Are you sure you want to clear the session? This will delete all authentication data and you will need to scan the QR code again.')) {
      return;
    }

    setActionLoading('clear');
    try {
      // This would typically call an API to clear the session
      disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Session cleared. Please reconnect by scanning the QR code.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Session Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your WhatsApp connection and session
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Current WhatsApp connection state</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className={`rounded-full p-3 ${
              isConnected
                ? 'bg-green-100 dark:bg-green-900/20'
                : isConnecting
                ? 'bg-yellow-100 dark:bg-yellow-900/20'
                : 'bg-red-100 dark:bg-red-900/20'
            }`}>
              {isConnected ? (
                <Wifi className="h-6 w-6 text-green-600" />
              ) : isConnecting ? (
                <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" />
              ) : (
                <WifiOff className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                </h3>
                <Badge variant={isConnected ? 'default' : isConnecting ? 'secondary' : 'destructive'}>
                  {botState.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? `Connected as ${phoneNumber || 'Unknown'}`
                  : isConnecting
                  ? 'Waiting for QR code scan...'
                  : 'Not connected to WhatsApp'}
              </p>
            </div>
          </div>

          {/* Session Info */}
          {isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SessionInfo
                label="Phone Number"
                value={phoneNumber || 'Unknown'}
                icon={Phone}
              />
              <SessionInfo
                label="Uptime"
                value={formatUptime(uptime)}
                icon={Clock}
              />
              <SessionInfo
                label="Status"
                value="Active"
                icon={CheckCircle}
              />
            </div>
          )}

          {/* Connect Button (when disconnected) */}
          {!isConnected && !isConnecting && (
            <Button onClick={() => connect()} className="w-full">
              <Wifi className="h-4 w-4 mr-2" />
              Connect to WhatsApp
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Session Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Session Actions</CardTitle>
          <CardDescription>Manage your WhatsApp session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Disconnect */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Disconnect</p>
                <p className="text-sm text-muted-foreground">
                  Disconnect from WhatsApp without clearing session
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={!isConnected || actionLoading === 'logout'}
            >
              {actionLoading === 'logout' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>

          {/* Backup Session */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Backup Session</p>
                <p className="text-sm text-muted-foreground">
                  Download session data for backup
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleBackup}
              disabled={!isConnected || actionLoading === 'backup'}
            >
              {actionLoading === 'backup' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Backup'
              )}
            </Button>
          </div>

          {/* Clear Session */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Clear Session</p>
                <p className="text-sm text-muted-foreground">
                  Delete session data and disconnect permanently
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleClearSession}
              disabled={actionLoading === 'clear'}
            >
              {actionLoading === 'clear' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Clear'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Session Security
              </p>
              <p className="text-yellow-700 dark:text-yellow-200">
                Your session data contains authentication credentials for your WhatsApp account.
                Never share session files with others. If you suspect your session has been
                compromised, clear it immediately and reconnect.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
