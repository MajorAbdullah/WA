'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wifi,
  WifiOff,
  Loader2,
  Power,
  PowerOff,
  Phone,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRDisplay } from './qr-display';
import type { ConnectionStatus as ConnectionStatusType } from '@/lib/socket/events';

// =============================================================================
// Types
// =============================================================================

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  phoneNumber: string | null;
  qrCode: string | null;
  pairingCode: string | null;
  onConnect: (options?: { usePairingCode?: boolean; phoneNumber?: string }) => void;
  onDisconnect: () => void;
  loading?: boolean;
  className?: string;
}

// =============================================================================
// Status Badge Component
// =============================================================================

function StatusBadge({ status }: { status: ConnectionStatusType }) {
  const config = {
    connected: {
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-500',
      label: 'Connected',
    },
    connecting: {
      variant: 'secondary' as const,
      className: 'bg-yellow-500 hover:bg-yellow-500 text-white',
      label: 'Connecting...',
    },
    disconnected: {
      variant: 'outline' as const,
      className: 'border-red-500 text-red-500',
      label: 'Disconnected',
    },
  };

  const { variant, className, label } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

// =============================================================================
// Status Icon Component
// =============================================================================

function StatusIcon({ status }: { status: ConnectionStatusType }) {
  const config = {
    connected: {
      icon: Wifi,
      bgClass: 'bg-green-100 dark:bg-green-900/20',
      iconClass: 'text-green-600 dark:text-green-400',
    },
    connecting: {
      icon: Loader2,
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconClass: 'text-yellow-600 dark:text-yellow-400 animate-spin',
    },
    disconnected: {
      icon: WifiOff,
      bgClass: 'bg-red-100 dark:bg-red-900/20',
      iconClass: 'text-red-600 dark:text-red-400',
    },
  };

  const { icon: Icon, bgClass, iconClass } = config[status];

  return (
    <div className={cn('rounded-full p-3', bgClass)}>
      <Icon className={cn('h-6 w-6', iconClass)} />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ConnectionStatus({
  status,
  phoneNumber,
  qrCode,
  pairingCode,
  onConnect,
  onDisconnect,
  loading = false,
  className,
}: ConnectionStatusProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected state
  if (status === 'connected') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusIcon status={status} />
              <div>
                <h3 className="font-semibold">Bot Connected</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{phoneNumber || 'Unknown number'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <Button
                variant="outline"
                size="sm"
                onClick={onDisconnect}
                className="text-red-500 border-red-500 hover:bg-red-50"
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connecting state
  if (status === 'connecting') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <StatusIcon status={status} />
              <div>
                <h3 className="font-semibold">Connecting to WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code with your phone to connect
                </p>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* QR Code / Pairing Code Section */}
          <div className="mt-6 flex justify-center">
            <QRDisplay
              qrCode={qrCode}
              pairingCode={pairingCode}
              onRefresh={() => onConnect()}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Disconnected state
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <StatusIcon status={status} />
            <div>
              <h3 className="font-semibold">Bot Disconnected</h3>
              <p className="text-sm text-muted-foreground">
                Connect to WhatsApp to start using the bot
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            <Button onClick={() => onConnect()}>
              <Power className="mr-2 h-4 w-4" />
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConnectionStatus;
