'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserGrowthData {
  date: string;
  newUsers: number;
  cumulativeUsers: number;
}

interface UserGrowthProps {
  data: UserGrowthData[];
  range: 'week' | 'month' | 'year';
  totals: {
    total: number;
    active: number;
    newInRange: number;
  };
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
  }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">
            {entry.dataKey === 'cumulativeUsers' ? 'Total Users' : 'New Users'}:
          </span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function UserGrowth({ data, range, totals }: UserGrowthProps) {
  // Format date labels based on range
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: formatDateLabel(d.date, range),
    }));
  }, [data, range]);

  // Calculate growth rate
  const growthRate = useMemo(() => {
    if (data.length < 2) return 0;
    const first = data[0].cumulativeUsers || 1;
    const last = data[data.length - 1].cumulativeUsers;
    return Math.round(((last - first) / first) * 100);
  }, [data]);

  return (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">User Growth</CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-500">
            +{totals.newInRange} new users
          </span>
          {growthRate !== 0 && (
            <span
              className={
                growthRate > 0 ? 'text-green-600' : 'text-red-600'
              }
            >
              {growthRate > 0 ? '+' : ''}
              {growthRate}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--neutral-200)"
                className="dark:stroke-neutral-800"
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                stroke="var(--neutral-400)"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--neutral-400)" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulativeUsers"
                stroke="#25D366"
                strokeWidth={2}
                fill="url(#userGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-center">
            <p className="text-2xl font-bold">{totals.total}</p>
            <p className="text-xs text-neutral-500">Total Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{totals.active}</p>
            <p className="text-xs text-neutral-500">Active (7d)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-primary">
              +{totals.newInRange}
            </p>
            <p className="text-xs text-neutral-500">New ({range})</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateLabel(date: string, range: string): string {
  if (range === 'year') {
    // Format as "Jan"
    const [, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[parseInt(month, 10) - 1];
  }
  // Default: format as "Jan 1"
  const d = new Date(date);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getDate()}`;
}

export default UserGrowth;
