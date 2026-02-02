import { NextResponse } from 'next/server';
import getDatabase from '@/lib/db';

export const dynamic = 'force-dynamic';

type TimeRange = 'week' | 'month' | 'year';

interface UserGrowthData {
  date: string;
  newUsers: number;
  cumulativeUsers: number;
}

/**
 * GET /api/analytics/users
 * Returns user growth data for area chart
 * Query params: range (week | month | year)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'month') as TimeRange;

    const db = getDatabase();
    const now = Date.now();

    // Calculate start date based on range
    let startDate: number;
    let groupBy: string;

    switch (range) {
      case 'week':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        groupBy = "date(datetime(first_seen / 1000, 'unixepoch'))";
        break;
      case 'month':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        groupBy = "date(datetime(first_seen / 1000, 'unixepoch'))";
        break;
      case 'year':
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        groupBy = "strftime('%Y-%m', datetime(first_seen / 1000, 'unixepoch'))";
        break;
      default:
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        groupBy = "date(datetime(first_seen / 1000, 'unixepoch'))";
    }

    // Get users count before the start date (for cumulative calculation)
    const beforeStartRow = db
      .prepare('SELECT COUNT(*) as count FROM users WHERE first_seen < ?')
      .get(startDate) as { count: number };
    const usersBeforeStart = beforeStartRow.count || 0;

    // Query new users per day/month
    const rows = db
      .prepare(
        `
      SELECT
        ${groupBy} as date,
        COUNT(*) as newUsers
      FROM users
      WHERE first_seen >= ?
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `
      )
      .all(startDate) as Array<{
      date: string;
      newUsers: number;
    }>;

    // Calculate cumulative users
    let cumulative = usersBeforeStart;
    const data: UserGrowthData[] = rows.map((row) => {
      cumulative += row.newUsers;
      return {
        date: row.date,
        newUsers: row.newUsers,
        cumulativeUsers: cumulative,
      };
    });

    // Fill in missing dates
    const filledData = fillMissingDates(data, startDate, now, range, usersBeforeStart);

    // Get totals
    const totalUsersRow = db
      .prepare('SELECT COUNT(*) as total FROM users')
      .get() as { total: number };
    const activeUsersRow = db
      .prepare('SELECT COUNT(*) as active FROM users WHERE last_seen >= ?')
      .get(now - 7 * 24 * 60 * 60 * 1000) as { active: number };
    const newUsersInRangeRow = db
      .prepare('SELECT COUNT(*) as count FROM users WHERE first_seen >= ?')
      .get(startDate) as { count: number };

    return NextResponse.json({
      data: filledData,
      totals: {
        total: totalUsersRow.total || 0,
        active: activeUsersRow.active || 0,
        newInRange: newUsersInRangeRow.count || 0,
      },
      range,
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}

// Helper to fill in missing dates with interpolated values
function fillMissingDates(
  data: UserGrowthData[],
  startDate: number,
  endDate: number,
  range: TimeRange,
  initialCumulative: number
): UserGrowthData[] {
  const dataMap = new Map<string, UserGrowthData>();
  data.forEach((d) => dataMap.set(d.date, d));

  const result: UserGrowthData[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  let lastCumulative = initialCumulative;

  while (current <= end) {
    let dateKey: string;

    if (range === 'year') {
      dateKey = current.toISOString().slice(0, 7);
      current.setMonth(current.getMonth() + 1);
    } else {
      dateKey = current.toISOString().slice(0, 10);
      current.setDate(current.getDate() + 1);
    }

    const existing = dataMap.get(dateKey);
    if (existing) {
      lastCumulative = existing.cumulativeUsers;
      result.push(existing);
    } else {
      result.push({
        date: dateKey,
        newUsers: 0,
        cumulativeUsers: lastCumulative,
      });
    }
  }

  return result;
}
