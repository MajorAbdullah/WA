import { NextResponse } from 'next/server';
import getDatabase from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CommandUsageData {
  command: string;
  count: number;
  percentage: number;
  successRate: number;
}

/**
 * GET /api/analytics/commands
 * Returns command usage statistics for pie chart
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const db = getDatabase();

    // Get total command count
    const totalRow = db
      .prepare('SELECT COUNT(*) as total FROM command_logs')
      .get() as { total: number };
    const total = totalRow.total || 0;

    if (total === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        topCommands: 0,
      });
    }

    // Get top commands with usage stats
    const rows = db
      .prepare(
        `
      SELECT
        command,
        COUNT(*) as count,
        ROUND(AVG(success) * 100, 1) as successRate
      FROM command_logs
      GROUP BY command
      ORDER BY count DESC
      LIMIT ?
    `
      )
      .all(limit) as Array<{
      command: string;
      count: number;
      successRate: number;
    }>;

    // Calculate percentages
    const data: CommandUsageData[] = rows.map((row) => ({
      command: row.command,
      count: row.count,
      percentage: Math.round((row.count / total) * 100 * 10) / 10,
      successRate: row.successRate || 0,
    }));

    // Calculate "Other" if there are more commands beyond the limit
    const topTotal = data.reduce((sum, d) => sum + d.count, 0);
    const otherCount = total - topTotal;

    if (otherCount > 0) {
      data.push({
        command: 'Other',
        count: otherCount,
        percentage: Math.round((otherCount / total) * 100 * 10) / 10,
        successRate: 0,
      });
    }

    // Get most used command info
    const mostUsed = rows.length > 0 ? rows[0] : null;

    return NextResponse.json({
      data,
      total,
      topCommands: rows.length,
      mostUsed: mostUsed
        ? {
            command: mostUsed.command,
            count: mostUsed.count,
            percentage: Math.round((mostUsed.count / total) * 100 * 10) / 10,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching command analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch command analytics' },
      { status: 500 }
    );
  }
}
