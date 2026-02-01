/**
 * Group Members API Route
 * GET /api/groups/[id]/members - Get group members/participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBotManager } from '@/lib/bot';
import { getUserByJid } from '@/lib/db/queries';

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

      // Format participants with additional user info from database
      const members = metadata.participants.map((p) => {
        // Try to get user info from database
        const userInfo = getUserByJid(p.id);

        return {
          jid: p.id,
          phone: p.id.split('@')[0],
          name: userInfo?.name || null,
          isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
          isSuperAdmin: p.admin === 'superadmin',
          // Additional info from database if available
          messageCount: userInfo?.message_count || 0,
          commandCount: userInfo?.command_count || 0,
          isBanned: userInfo?.is_banned || false,
          lastSeen: userInfo?.last_seen || null,
        };
      });

      // Sort: superadmins first, then admins, then by name/phone
      members.sort((a, b) => {
        if (a.isSuperAdmin && !b.isSuperAdmin) return -1;
        if (!a.isSuperAdmin && b.isSuperAdmin) return 1;
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        const nameA = a.name || a.phone;
        const nameB = b.name || b.phone;
        return nameA.localeCompare(nameB);
      });

      return NextResponse.json({
        groupId,
        groupName: metadata.subject,
        members,
        total: members.length,
        admins: members.filter((m) => m.isAdmin).length,
      });
    } catch (socketError) {
      console.error('Error fetching group members:', socketError);
      return NextResponse.json(
        { error: 'Failed to fetch group members' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in group members route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    );
  }
}
