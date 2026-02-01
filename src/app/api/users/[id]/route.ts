/**
 * User Details API Route
 * GET /api/users/[id] - Get user details with recent messages and command history
 * DELETE /api/users/[id] - Delete a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByJid } from '@/lib/db/queries';
import { getMessagesByJid } from '@/lib/db/queries';
import { getCommandLogsByUser } from '@/lib/db/queries';
import { getDatabase } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const jid = decodeURIComponent(id);

    // Get user details
    const user = getUserByJid(jid);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent messages from this user
    const recentMessages = getMessagesByJid(jid, { page: 1, limit: 10 });

    // Get command history for this user
    const commandHistory = getCommandLogsByUser(jid, { page: 1, limit: 20 });

    return NextResponse.json({
      user,
      recentMessages: recentMessages.data,
      commandHistory: commandHistory.data,
      stats: {
        totalMessages: recentMessages.total,
        totalCommands: commandHistory.total,
      },
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const jid = decodeURIComponent(id);

    // Check if user exists
    const user = getUserByJid(jid);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user from database
    const db = getDatabase();
    const result = db.prepare('DELETE FROM users WHERE jid = ?').run(jid);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
