'use client';

import { MessageSquare, Users, Terminal, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <Card className="dashboard-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              {icon}
            </div>
            <div>
              <p className="text-sm text-neutral-500">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
            </div>
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-neutral-500'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              <span>
                {change > 0 ? '+' : ''}
                {change}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatValue(value: string | number): string {
  if (typeof value === 'string') return value;
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

interface StatsOverviewProps {
  totalMessages: number;
  totalUsers: number;
  totalCommands: number;
  activeUsers: number;
  messageChange?: number;
  userChange?: number;
  commandChange?: number;
}

export function StatsOverview({
  totalMessages,
  totalUsers,
  totalCommands,
  activeUsers,
  messageChange,
  userChange,
  commandChange,
}: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Messages"
        value={totalMessages}
        change={messageChange}
        trend={messageChange ? (messageChange > 0 ? 'up' : 'down') : 'neutral'}
        icon={<MessageSquare className="h-5 w-5" />}
      />
      <StatCard
        title="Total Users"
        value={totalUsers}
        change={userChange}
        trend={userChange ? (userChange > 0 ? 'up' : 'down') : 'neutral'}
        icon={<Users className="h-5 w-5" />}
      />
      <StatCard
        title="Commands Executed"
        value={totalCommands}
        change={commandChange}
        trend={commandChange ? (commandChange > 0 ? 'up' : 'down') : 'neutral'}
        icon={<Terminal className="h-5 w-5" />}
      />
      <StatCard
        title="Active Users (7d)"
        value={activeUsers}
        icon={<Users className="h-5 w-5" />}
      />
    </div>
  );
}

export default StatsOverview;
