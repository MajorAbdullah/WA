/**
 * Broadcast Send API Route
 * POST /api/broadcast/[id]/send - Start sending a broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBroadcastById,
  updateBroadcastStatus,
  updateBroadcastProgress,
} from '@/lib/db/queries';
import { getBotManager } from '@/lib/bot';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const broadcast = getBroadcastById(id);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Check if broadcast can be sent
    if (broadcast.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot send broadcast with status: ${broadcast.status}` },
        { status: 400 }
      );
    }

    // Check if scheduled for later
    if (broadcast.scheduled_at && broadcast.scheduled_at > Date.now()) {
      return NextResponse.json(
        { error: 'Broadcast is scheduled for later' },
        { status: 400 }
      );
    }

    // Check bot connection
    const botManager = getBotManager();
    const isConnected = await botManager.isConnected();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Bot is not connected. Please connect the bot first.' },
        { status: 503 }
      );
    }

    // Parse recipients
    const recipients: string[] = JSON.parse(broadcast.recipients);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients in broadcast' },
        { status: 400 }
      );
    }

    // Update status to in_progress
    updateBroadcastStatus(id, 'in_progress');

    // Start sending in background
    // Note: In production, this should use a proper job queue
    sendBroadcastMessages(id, broadcast.message, recipients).catch((err) => {
      console.error('Broadcast sending failed:', err);
      updateBroadcastStatus(id, 'pending'); // Revert to pending on failure
    });

    return NextResponse.json({
      success: true,
      message: 'Broadcast sending started',
      broadcast: {
        id,
        status: 'in_progress',
        recipientCount: recipients.length,
      },
    });
  } catch (error) {
    console.error('Error starting broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to start broadcast' },
      { status: 500 }
    );
  }
}

/**
 * Send broadcast messages to all recipients
 * This runs in the background after the API returns
 */
async function sendBroadcastMessages(
  broadcastId: string,
  message: string,
  recipients: string[]
): Promise<void> {
  const botManager = getBotManager();
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      // Check if broadcast was cancelled
      const currentBroadcast = getBroadcastById(broadcastId);
      if (!currentBroadcast || currentBroadcast.status === 'cancelled') {
        console.log(`Broadcast ${broadcastId} was cancelled, stopping...`);
        return;
      }

      // Send message
      await botManager.sendText(recipient, message);
      sentCount++;

      // Update progress periodically (every 5 messages or at the end)
      if (sentCount % 5 === 0 || sentCount + failedCount === recipients.length) {
        updateBroadcastProgress(broadcastId, sentCount, failedCount);
      }

      // Add delay between messages to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
    } catch (error) {
      console.error(`Failed to send to ${recipient}:`, error);
      failedCount++;

      // Update progress on failure too
      if (failedCount % 5 === 0 || sentCount + failedCount === recipients.length) {
        updateBroadcastProgress(broadcastId, sentCount, failedCount);
      }
    }
  }

  // Final update
  updateBroadcastProgress(broadcastId, sentCount, failedCount);
  updateBroadcastStatus(broadcastId, 'completed');

  console.log(
    `Broadcast ${broadcastId} completed: ${sentCount} sent, ${failedCount} failed`
  );
}
