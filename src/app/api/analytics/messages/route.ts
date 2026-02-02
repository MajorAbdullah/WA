import { NextResponse } from 'next/server';
import getDatabase from '@/lib/db';

export const dynamic = 'force-dynamic';

type TimeRange = 'today' | 'week' | 'month' | 'year';

interface MessageVolumeData {
  date: string;
  incoming: number;
  outgoing: number;
  total: number;
}

/**
 * GET /api/analytics/messages
 * Returns message volume data for charts
 * Query params: range (today | week | month | year)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') || 'week') as TimeRange;

    const db = getDatabase();
    const now = Date.now();

    // Calculate start date based on range
    let startDate: number;
    let groupBy: string;

    switch (range) {
      case 'today':
        startDate = now - 24 * 60 * 60 * 1000;
        groupBy = "strftime('%Y-%m-%d %H:00', datetime(timestamp / 1000, 'unixepoch'))";
        break;
      case 'week':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        groupBy = "date(datetime(timestamp / 1000, 'unixepoch'))";
        break;
      case 'month':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        groupBy = "date(datetime(timestamp / 1000, 'unixepoch'))";
        break;
      case 'year':
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        groupBy = "strftime('%Y-%m', datetime(timestamp / 1000, 'unixepoch'))";
        break;
      default:
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        groupBy = "date(datetime(timestamp / 1000, 'unixepoch'))";
    }

    // Query message volume data
    const rows = db
      .prepare(
        `
      SELECT
        ${groupBy} as date,
        SUM(CASE WHEN from_me = 0 THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN from_me = 1 THEN 1 ELSE 0 END) as outgoing,
        COUNT(*) as total
      FROM messages
      WHERE timestamp >= ?
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `
      )
      .all(startDate) as Array<{
      date: string;
      incoming: number;
      outgoing: number;
      total: number;
    }>;

    // Get totals for the period
    const totals = db
      .prepare(
        `
      SELECT
        SUM(CASE WHEN from_me = 0 THEN 1 ELSE 0 END) as totalIncoming,
        SUM(CASE WHEN from_me = 1 THEN 1 ELSE 0 END) as totalOutgoing,
        COUNT(*) as totalMessages
      FROM messages
      WHERE timestamp >= ?
    `
      )
      .get(startDate) as {
      totalIncoming: number;
      totalOutgoing: number;
      totalMessages: number;
    };

    // Fill in missing dates with zeros
    const data = fillMissingDates(rows, startDate, now, range);

    return NextResponse.json({
      data,
      totals: {
        incoming: totals.totalIncoming || 0,
        outgoing: totals.totalOutgoing || 0,
        total: totals.totalMessages || 0,
      },
      range,
    });
  } catch (error) {
    console.error('Error fetching message analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message analytics' },
      { status: 500 }
    );
  }
}

// Helper to fill in missing dates with zero values
function fillMissingDates(
  data: MessageVolumeData[],
  startDate: number,
  endDate: number,
  range: TimeRange
): MessageVolumeData[] {
  const dataMap = new Map<string, MessageVolumeData>();
  data.forEach((d) => dataMap.set(d.date, d));

  const result: MessageVolumeData[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    let dateKey: string;

    switch (range) {
      case 'today':
        dateKey = current.toISOString().slice(0, 13) + ':00';
        current.setHours(current.getHours() + 1);
        break;
      case 'year':
        dateKey = current.toISOString().slice(0, 7);
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        dateKey = current.toISOString().slice(0, 10);
        current.setDate(current.getDate() + 1);
    }

    const existing = dataMap.get(dateKey);
    result.push(
      existing || {
        date: dateKey,
        incoming: 0,
        outgoing: 0,
        total: 0,
      }
    );
  }

  return result;
}
