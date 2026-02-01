/**
 * Group Details API Route
 * GET /api/groups/[id] - Get group details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBotManager } from '@/lib/bot';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

      // Fetch group metadata
      const metadata = await socket.groupMetadata(groupId);

      if (!metadata) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      // Format participants
      const participants = metadata.participants.map((p) => ({
        jid: p.id,
        isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
        isSuperAdmin: p.admin === 'superadmin',
      }));

      // Get admin list
      const admins = participants.filter((p) => p.isAdmin).map((p) => p.jid);

      const group = {
        id: metadata.id,
        name: metadata.subject,
        owner: metadata.owner,
        creation: metadata.creation,
        description: metadata.desc || null,
        descriptionId: metadata.descId || null,
        participants,
        participantCount: participants.length,
        admins,
        adminCount: admins.length,
        announce: metadata.announce || false,
        restrict: metadata.restrict || false,
        ephemeral: metadata.ephemeralDuration || null,
      };

      return NextResponse.json({ group });
    } catch (socketError) {
      console.error('Error fetching group details:', socketError);

      // Check if it's a "not in group" error
      const errorMessage = String(socketError);
      if (errorMessage.includes('not-authorized') || errorMessage.includes('forbidden')) {
        return NextResponse.json(
          { error: 'Bot is not a member of this group' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch group details' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in group details route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group details' },
      { status: 500 }
    );
  }
}
