/**
 * Broadcasts API Route
 * GET /api/broadcast - List all broadcasts with pagination
 * POST /api/broadcast - Create a new broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBroadcasts,
  createBroadcast,
  getUsers,
  getUserCount,
} from '@/lib/db/queries';

// Generate UUID using crypto
function generateId(): string {
  return crypto.randomUUID();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || undefined;

    // Validate pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // Get broadcasts from database
    const result = getBroadcasts({ page: validPage, limit: validLimit });

    // Filter by status if provided
    let broadcasts = result.data;
    if (status) {
      broadcasts = broadcasts.filter((b) => b.status === status);
    }

    // Parse recipients JSON for each broadcast
    const parsedBroadcasts = broadcasts.map((b) => ({
      ...b,
      recipients: JSON.parse(b.recipients),
      recipientCount: JSON.parse(b.recipients).length,
    }));

    // Get stats
    const stats = {
      total: result.total,
      pending: result.data.filter((b) => b.status === 'pending').length,
      inProgress: result.data.filter((b) => b.status === 'in_progress').length,
      completed: result.data.filter((b) => b.status === 'completed').length,
      cancelled: result.data.filter((b) => b.status === 'cancelled').length,
    };

    return NextResponse.json({
      broadcasts: parsedBroadcasts,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcasts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Determine recipients based on recipientType
    let recipients: string[] = [];
    const recipientType = body.recipientType || 'all';

    switch (recipientType) {
      case 'all': {
        // Get all active (non-banned) users
        const usersResult = getUsers({ is_banned: false }, { limit: 10000 });
        recipients = usersResult.data.map((u) => u.jid);
        break;
      }
      case 'groups': {
        // Recipients will be group JIDs - these should be provided in body.recipients
        if (!body.recipients || !Array.isArray(body.recipients)) {
          return NextResponse.json(
            { error: 'Group recipients list is required' },
            { status: 400 }
          );
        }
        recipients = body.recipients.filter((r: string) => r.endsWith('@g.us'));
        break;
      }
      case 'custom': {
        // Custom list of recipients
        if (!body.recipients || !Array.isArray(body.recipients)) {
          return NextResponse.json(
            { error: 'Recipients list is required for custom selection' },
            { status: 400 }
          );
        }
        recipients = body.recipients;
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Invalid recipient type' },
          { status: 400 }
        );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found' },
        { status: 400 }
      );
    }

    // Parse scheduled time
    let scheduledAt: number | null = null;
    if (body.scheduledAt) {
      const scheduledDate = new Date(body.scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled date' },
          { status: 400 }
        );
      }
      if (scheduledDate.getTime() < Date.now()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
      scheduledAt = scheduledDate.getTime();
    }

    // Create the broadcast
    const broadcast = createBroadcast({
      id: generateId(),
      message: body.message.trim(),
      recipients,
      scheduled_at: scheduledAt,
    });

    return NextResponse.json({
      success: true,
      broadcast: {
        ...broadcast,
        recipients: JSON.parse(broadcast.recipients),
        recipientCount: recipients.length,
      },
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to create broadcast' },
      { status: 500 }
    );
  }
}
