'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Smartphone, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface QRDisplayProps {
  qrCode: string | null;
  pairingCode: string | null;
  onRefresh?: () => void;
  onUsePairingCode?: () => void;
  loading?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function QRDisplay({
  qrCode,
  pairingCode,
  onRefresh,
  onUsePairingCode,
  loading = false,
  className,
}: QRDisplayProps) {
  const [showPairingCode, setShowPairingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset copied state after delay
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyPairingCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <Skeleton className="h-48 w-48 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  // Show pairing code mode
  if (showPairingCode && pairingCode) {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        <Card className="p-6">
          <CardContent className="p-0 flex flex-col items-center gap-4">
            <Smartphone className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Enter this code in WhatsApp
              </p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-mono font-bold tracking-wider bg-muted px-4 py-2 rounded">
                  {pairingCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyPairingCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Go to WhatsApp Settings → Linked Devices → Link a Device → Link with phone number
            </p>
          </CardContent>
        </Card>
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowPairingCode(false)}
        >
          Use QR Code instead
        </Button>
      </div>
    );
  }

  // Show QR code mode
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {qrCode ? (
        <>
          <div className="qr-container p-4 bg-white rounded-lg shadow-sm">
            {/* QR Code is a data URL, render as image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode}
              alt="WhatsApp QR Code"
              className="h-48 w-48"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Scan with WhatsApp to connect
          </p>
        </>
      ) : (
        <div className="qr-container flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-sm text-muted-foreground text-center px-4">
            QR code will appear here
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
        {pairingCode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPairingCode(true)}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Use Pairing Code
          </Button>
        )}
        {!pairingCode && onUsePairingCode && (
          <Button variant="outline" size="sm" onClick={onUsePairingCode}>
            <Smartphone className="mr-2 h-4 w-4" />
            Use Pairing Code
          </Button>
        )}
      </div>
    </div>
  );
}

export default QRDisplay;
