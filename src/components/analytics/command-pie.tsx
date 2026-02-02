'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CommandUsageData {
  command: string;
  count: number;
  percentage: number;
  successRate: number;
}

interface CommandPieProps {
  data: CommandUsageData[];
  total: number;
}

// Brand-inspired color palette
const COLORS = [
  '#25D366', // Brand primary
  '#128C7E', // Brand secondary
  '#34B7F1', // Brand accent
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#6B7280', // Gray (Other)
];

// Custom tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: CommandUsageData;
  }>;
}) {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 shadow-lg">
      <p className="font-medium text-sm">{data.command}</p>
      <div className="mt-1 space-y-1 text-sm">
        <p className="text-neutral-500">
          Count: <span className="font-medium text-neutral-900 dark:text-white">{data.count}</span>
        </p>
        <p className="text-neutral-500">
          Percentage: <span className="font-medium text-neutral-900 dark:text-white">{data.percentage}%</span>
        </p>
        {data.successRate > 0 && (
          <p className="text-neutral-500">
            Success Rate: <span className="font-medium text-green-600">{data.successRate}%</span>
          </p>
        )}
      </div>
    </div>
  );
}

// Custom legend
function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.slice(0, 6).map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {entry.value}
          </span>
        </div>
      ))}
      {payload.length > 6 && (
        <span className="text-sm text-neutral-500">+{payload.length - 6} more</span>
      )}
    </div>
  );
}

export function CommandPie({ data, total }: CommandPieProps) {
  if (data.length === 0) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-lg">Command Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-neutral-500">
            No command data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Command Usage</CardTitle>
        <span className="text-sm text-neutral-500">{total} total</span>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="command"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top command highlight */}
        {data.length > 0 && (
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <p className="text-sm text-neutral-500">Most Used Command</p>
            <p className="font-medium">
              {data[0].command}{' '}
              <span className="text-neutral-500">
                ({data[0].count} uses, {data[0].percentage}%)
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CommandPie;
