'use client';

/**
 * User Details Page
 * Displays detailed information about a specific user
 */

import { useState, use } from 'react';
import Link from 'next/link';
import { useUserDetails } from '@/hooks/use-users';
import { UserCard, BanDialog, UnbanDialog } from '@/components/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MessageSquare,
  Terminal,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import type { User, Message, CommandLog } from '@/types/database';

interface PageProps {
  params: Promise<{ id: string }>;
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

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default function UserDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const jid = decodeURIComponent(id);

  const {
    user,
    recentMessages,
    commandHistory,
    stats,
    loading,
    error,
    refetch,
    banUser,
    unbanUser,
  } = useUserDetails(jid);

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleBan = async (reason?: string) => {
    setActionLoading(true);
    const success = await banUser(reason);
    setActionLoading(false);

    if (success) {
      setBanDialogOpen(false);
    }
  };

  const handleUnban = async () => {
    setActionLoading(true);
    const success = await unbanUser();
    setActionLoading(false);

    if (success) {
      setUnbanDialogOpen(false);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <div className="lg:col-span-2">
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" asChild>
                <Link href="/users">Back to Users</Link>
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

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{user.name || 'Unknown User'}</h1>
            <p className="text-muted-foreground">
              {user.phone || user.jid.split('@')[0]}
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div>
          <UserCard
            user={user}
            onBan={() => setBanDialogOpen(true)}
            onUnban={() => setUnbanDialogOpen(true)}
          />
        </div>

        {/* Activity Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="messages">
            <TabsList className="mb-4">
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages ({stats.totalMessages})
              </TabsTrigger>
              <TabsTrigger value="commands" className="gap-2">
                <Terminal className="h-4 w-4" />
                Commands ({stats.totalCommands})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {(recentMessages as Message[]).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(recentMessages as Message[]).map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.from_me
                              ? 'bg-primary/10 ml-8'
                              : 'bg-muted mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {message.from_me ? 'Bot' : 'User'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">
                            {message.content || `[${message.type}]`}
                          </p>
                        </div>
                      ))}
                      {stats.totalMessages > 10 && (
                        <div className="text-center pt-2">
                          <Button variant="link" size="sm" asChild>
                            <Link href={`/messages?jid=${encodeURIComponent(jid)}`}>
                              View all {stats.totalMessages} messages
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commands">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Command History</CardTitle>
                </CardHeader>
                <CardContent>
                  {(commandHistory as CommandLog[]).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No commands executed yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(commandHistory as CommandLog[]).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <div>
                              <code className="text-sm font-mono">
                                {log.command}
                              </code>
                              {log.args && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  {log.args}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {log.response_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {log.response_time}ms
                              </span>
                            )}
                            <span title={formatTimestamp(log.created_at)}>
                              {formatRelativeTime(new Date(log.created_at).getTime())}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Ban Dialog */}
      <BanDialog
        user={user}
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        onConfirm={handleBan}
        loading={actionLoading}
      />

      {/* Unban Dialog */}
      <UnbanDialog
        user={user}
        open={unbanDialogOpen}
        onOpenChange={setUnbanDialogOpen}
        onConfirm={handleUnban}
        loading={actionLoading}
      />
    </div>
  );
}
