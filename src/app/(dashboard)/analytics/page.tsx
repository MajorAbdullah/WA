'use client';

import { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsOverview } from '@/components/analytics/stats-overview';
import { MessageChart } from '@/components/analytics/message-chart';
import { CommandPie } from '@/components/analytics/command-pie';
import { UserGrowth } from '@/components/analytics/user-growth';
import { LoadingSpinner } from '@/components/shared/loading';

type TimeRange = 'today' | 'week' | 'month' | 'year';

interface MessageData {
  data: Array<{ date: string; incoming: number; outgoing: number; total: number }>;
  totals: { incoming: number; outgoing: number; total: number };
}

interface CommandData {
  data: Array<{ command: string; count: number; percentage: number; successRate: number }>;
  total: number;
}

interface UserData {
  data: Array<{ date: string; newUsers: number; cumulativeUsers: number }>;
  totals: { total: number; active: number; newInRange: number };
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [messageData, setMessageData] = useState<MessageData | null>(null);
  const [commandData, setCommandData] = useState<CommandData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Fetch all analytics data
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [messagesRes, commandsRes, usersRes] = await Promise.all([
        fetch(`/api/analytics/messages?range=${range}`),
        fetch('/api/analytics/commands'),
        fetch(`/api/analytics/users?range=${range}`),
      ]);

      if (messagesRes.ok) {
        setMessageData(await messagesRes.json());
      }
      if (commandsRes.ok) {
        setCommandData(await commandsRes.json());
      }
      if (usersRes.ok) {
        setUserData(await usersRes.json());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on mount and when range changes
  useEffect(() => {
    fetchData();
  }, [range]);

  // Export data as CSV
  const exportCSV = () => {
    if (!messageData) return;

    const headers = ['Date', 'Incoming', 'Outgoing', 'Total'];
    const rows = messageData.data.map((d) => [
      d.date,
      d.incoming,
      d.outgoing,
      d.total,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--header-height))]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-neutral-500">Track your bot performance and usage</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>

          {/* Export button */}
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview
        totalMessages={messageData?.totals.total || 0}
        totalUsers={userData?.totals.total || 0}
        totalCommands={commandData?.total || 0}
        activeUsers={userData?.totals.active || 0}
      />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message Volume Chart */}
        {messageData && (
          <MessageChart data={messageData.data} range={range} />
        )}

        {/* Command Usage Pie */}
        {commandData && (
          <CommandPie data={commandData.data} total={commandData.total} />
        )}
      </div>

      {/* User Growth Chart - Full Width */}
      {userData && (
        <UserGrowth
          data={userData.data}
          range={range === 'today' ? 'week' : range}
          totals={userData.totals}
        />
      )}
    </div>
  );
}
