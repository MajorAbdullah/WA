/**
 * Groups API Route
 * GET /api/groups - List all groups the bot is in
 */

import { NextResponse } from 'next/server';
import { getBotManager } from '@/lib/bot';

export async function GET() {
  try {
    const botManager = getBotManager();

    // Check if bot is connected
    const isConnected = await botManager.isConnected();

    if (!isConnected) {
      return NextResponse.json({
        groups: [],
        total: 0,
        message: 'Bot is not connected. Connect the bot to see groups.',
      });
    }

    // Get groups from the bot socket
    // Note: Groups are fetched from WhatsApp directly through the socket
    // This requires the bot to be connected
    try {
      const socket = await import('@syed-abdullah-shah/wa-bot-cli/dist/core/connection').then(
        (m) => m.getSocket()
      );

      if (!socket) {
        return NextResponse.json({
          groups: [],
          total: 0,
          message: 'Socket not available',
        });
      }

      // Fetch groups from WhatsApp
      const groups = await socket.groupFetchAllParticipating();

      // Convert to array and format
      const groupList = Object.values(groups).map((group) => ({
        id: group.id,
        name: group.subject,
        owner: group.owner,
        creation: group.creation,
        participantCount: group.participants?.length || 0,
        description: group.desc || null,
        announce: group.announce || false, // Only admins can send messages
        restrict: group.restrict || false, // Only admins can edit group info
      }));

      // Sort by name
      groupList.sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({
        groups: groupList,
        total: groupList.length,
      });
    } catch (socketError) {
      console.error('Error fetching groups from socket:', socketError);
      return NextResponse.json({
        groups: [],
        total: 0,
        message: 'Failed to fetch groups from WhatsApp',
      });
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}
