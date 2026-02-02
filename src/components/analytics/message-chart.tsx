'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MessageVolumeData {
  date: string;
  incoming: number;
  outgoing: number;
  total: number;
}

interface MessageChartProps {
  data: MessageVolumeData[];
  range: 'today' | 'week' | 'month' | 'year';
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-500">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function MessageChart({ data, range }: MessageChartProps) {
  // Format date labels based on range
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayDate: formatDateLabel(d.date, range),
    }));
  }, [data, range]);

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="text-lg">Message Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
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
              <Legend />
              <Line
                type="monotone"
                dataKey="incoming"
                name="Incoming"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="outgoing"
                name="Outgoing"
                stroke="#25D366"
                strokeWidth={2}
                dot={{ fill: '#25D366', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateLabel(date: string, range: string): string {
  if (range === 'today') {
    // Extract hour from ISO format
    const hour = date.slice(11, 13);
    return `${hour}:00`;
  }
  if (range === 'year') {
    // Format as "Jan 2024"
    const [year, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }
  // Default: format as "Jan 1"
  const d = new Date(date);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getDate()}`;
}

export default MessageChart;
