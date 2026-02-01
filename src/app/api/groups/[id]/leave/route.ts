/**
 * Group Leave API Route
 * POST /api/groups/[id]/leave - Leave a group
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBotManager } from '@/lib/bot';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const groupId = decodeURIComponent(id);

    const botManager = getBotManager();

    // Check if bot is connected
    const isConnected = await botManager.isConnected();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Bot is not connected' },
        { status: 503 }
      );
    }

    try {
      const socket = await import('@syed-abdullah-shah/wa-bot-cli/dist/core/connection').then(
        (m) => m.getSocket()
      );

      if (!socket) {
        return NextResponse.json(
          { error: 'Socket not available' },
          { status: 503 }
        );
      }

      // First verify the bot is in the group
      try {
        await socket.groupMetadata(groupId);
      } catch {
        return NextResponse.json(
          { error: 'Bot is not a member of this group' },
          { status: 404 }
        );
      }

      // Leave the group
      await socket.groupLeave(groupId);

      return NextResponse.json({
        success: true,
        message: 'Successfully left the group',
        groupId,
      });
    } catch (socketError) {
      console.error('Error leaving group:', socketError);

      const errorMessage = String(socketError);
      if (errorMessage.includes('not-authorized')) {
        return NextResponse.json(
          { error: 'Not authorized to leave this group' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to leave group' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in leave group route:', error);
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
}
