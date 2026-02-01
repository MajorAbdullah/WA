'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Users,
  Terminal,
  Clock,
} from 'lucide-react';

// Dashboard components
import { StatsGrid } from '@/components/dashboard/stats-card';
import { ConnectionStatus } from '@/components/dashboard/connection-status';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';

// Hooks
import { useBotStatus } from '@/hooks/use-bot-status';
import { useStats, formatUptime, formatNumber } from '@/hooks/use-stats';
import { useSocket } from '@/hooks/use-socket';

// =============================================================================
// Dashboard Page Component
// =============================================================================

export default function DashboardPage() {
  const {
    botState,
    isConnected,
    isConnecting,
    qrCode,
    pairingCode,
    phoneNumber,
    connect,
    disconnect,
  } = useBotStatus();

  const { stats, formattedUptime, isLoading: statsLoading } = useStats();
  const { isConnected: socketConnected } = useSocket();

  // Prepare stats data for the grid
  const statsData = [
    {
      title: 'Total Messages',
      value: formatNumber(stats.messagesReceived + stats.messagesSent),
      description: `${formatNumber(stats.messagesReceived)} received, ${formatNumber(stats.messagesSent)} sent`,
      icon: MessageSquare,
    },
    {
      title: 'Active Users',
      value: formatNumber(stats.totalUsers),
      description: `${formatNumber(stats.activeChats)} active chats`,
      icon: Users,
    },
    {
      title: 'Commands Executed',
      value: formatNumber(stats.commandsExecuted),
      description: stats.errors > 0 ? `${stats.errors} errors` : 'No errors',
      icon: Terminal,
    },
    {
      title: 'Uptime',
      value: formattedUptime,
      description: isConnected ? 'Bot is running' : 'Bot is offline',
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your WhatsApp bot activity and statistics.
        </p>
      </div>

      {/* Connection status card */}
      <ConnectionStatus
        status={botState.status}
        phoneNumber={phoneNumber}
        qrCode={qrCode}
        pairingCode={pairingCode}
        onConnect={connect}
        onDisconnect={disconnect}
        loading={!socketConnected}
      />

      {/* Stats grid */}
      <StatsGrid
        stats={statsData}
        loading={!socketConnected}
      />

      {/* Quick actions and activity feed */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick actions */}
        <QuickActions />

        {/* Recent activity */}
        <ActivityFeed
          maxItems={10}
          loading={!socketConnected}
        />
      </div>

      {/* Getting started guide - only show when disconnected */}
      {!isConnected && !isConnecting && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to set up your WhatsApp bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Connect your WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">
                    Click the Connect button above and scan the QR code with your WhatsApp mobile app.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Configure settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize your bot&apos;s behavior, commands, and response settings.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Start messaging</h4>
                  <p className="text-sm text-muted-foreground">
                    Your bot is ready! Users can now interact with it on WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
