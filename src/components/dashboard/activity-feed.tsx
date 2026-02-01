'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  MessageSquareOff,
  User,
  UserPlus,
  Terminal,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBotStore, type ActivityItem, type ActivityType } from '@/stores/bot-store';
import { useSocket } from '@/hooks/use-socket';

// =============================================================================
// Activity Item Component
// =============================================================================

interface ActivityIconConfig {
  icon: typeof MessageSquare;
  bgClass: string;
  iconClass: string;
}

const activityIcons: Record<ActivityType, ActivityIconConfig> = {
  message_incoming: {
    icon: MessageSquare,
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  message_outgoing: {
    icon: MessageSquareOff,
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  user_joined: {
    icon: UserPlus,
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
  user_update: {
    icon: User,
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
  command_executed: {
    icon: Terminal,
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    iconClass: 'text-orange-600 dark:text-orange-400',
  },
  bot_connected: {
    icon: Wifi,
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  bot_disconnected: {
    icon: WifiOff,
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    iconClass: 'text-red-600 dark:text-red-400',
  },
  error: {
    icon: AlertTriangle,
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    iconClass: 'text-red-600 dark:text-red-400',
  },
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ActivityItemRow({ activity }: { activity: ActivityItem }) {
  const config = activityIcons[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={cn('rounded-full p-2 shrink-0', config.bgClass)}>
        <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{activity.title}</p>
          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(activity.timestamp)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {activity.description}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center text-center py-8">
      <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No recent activity</p>
      <p className="text-xs text-muted-foreground mt-1">
        Activity will appear here once the bot is connected
      </p>
    </div>
  );
}

// =============================================================================
// Loading State Component
// =============================================================================

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface ActivityFeedProps {
  maxItems?: number;
  loading?: boolean;
  className?: string;
}

export function ActivityFeed({
  maxItems = 10,
  loading = false,
  className,
}: ActivityFeedProps) {
  const { activities, addMessageActivity, addUserActivity } = useBotStore();
  const { socket, isConnected } = useSocket();

  // Subscribe to real-time events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingMessage = (message: import('@/types/database').Message) => {
      addMessageActivity(message, 'incoming');
    };

    const handleOutgoingMessage = (message: import('@/types/database').Message) => {
      addMessageActivity(message, 'outgoing');
    };

    const handleUserUpdate = (user: import('@/types/database').User) => {
      addUserActivity(user, false);
    };

    socket.on('message:incoming', handleIncomingMessage);
    socket.on('message:outgoing', handleOutgoingMessage);
    socket.on('user:update', handleUserUpdate);

    return () => {
      socket.off('message:incoming', handleIncomingMessage);
      socket.off('message:outgoing', handleOutgoingMessage);
      socket.off('user:update', handleUserUpdate);
    };
  }, [socket, isConnected, addMessageActivity, addUserActivity]);

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest bot activity and events</CardDescription>
          </div>
          {activities.length > 0 && (
            <Badge variant="secondary">{activities.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState />
        ) : displayedActivities.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            {displayedActivities.map((activity) => (
              <ActivityItemRow key={activity.id} activity={activity} />
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
