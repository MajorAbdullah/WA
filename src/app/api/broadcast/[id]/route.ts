/**
 * Broadcast Details API Route
 * GET /api/broadcast/[id] - Get broadcast details and status
 * DELETE /api/broadcast/[id] - Cancel a broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBroadcastById,
  cancelBroadcast,
  updateBroadcastStatus,
  updateBroadcastProgress,
} from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const broadcast = getBroadcastById(id);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Parse recipients
    const recipients = JSON.parse(broadcast.recipients);

    return NextResponse.json({
      broadcast: {
        ...broadcast,
        recipients,
        recipientCount: recipients.length,
        progress: {
          total: recipients.length,
          sent: broadcast.sent_count,
          failed: broadcast.failed_count,
          remaining: recipients.length - broadcast.sent_count - broadcast.failed_count,
          percentage: recipients.length > 0
            ? Math.round((broadcast.sent_count / recipients.length) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcast' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const broadcast = getBroadcastById(id);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Check if broadcast can be cancelled
    if (broadcast.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed broadcast' },
        { status: 400 }
      );
    }

    if (broadcast.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Broadcast is already cancelled' },
        { status: 400 }
      );
    }

    // Cancel the broadcast
    const success = cancelBroadcast(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel broadcast' },
        { status: 500 }
      );
    }

    // Get updated broadcast
    const updatedBroadcast = getBroadcastById(id);

    return NextResponse.json({
      success: true,
      message: 'Broadcast cancelled successfully',
      broadcast: updatedBroadcast,
    });
  } catch (error) {
    console.error('Error cancelling broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to cancel broadcast' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const broadcast = getBroadcastById(id);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Update status if provided
    if (body.status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateBroadcastStatus(id, body.status);
    }

    // Update progress if provided
    if (body.sent_count !== undefined || body.failed_count !== undefined) {
      updateBroadcastProgress(
        id,
        body.sent_count ?? broadcast.sent_count,
        body.failed_count ?? broadcast.failed_count
      );
    }

    // Get updated broadcast
    const updatedBroadcast = getBroadcastById(id);

    return NextResponse.json({
      success: true,
      broadcast: updatedBroadcast,
    });
  } catch (error) {
    console.error('Error updating broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to update broadcast' },
      { status: 500 }
    );
  }
}
