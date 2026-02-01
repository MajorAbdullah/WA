/**
 * User Ban API Route
 * POST /api/users/[id]/ban - Ban a user
 * DELETE /api/users/[id]/ban - Unban a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByJid, banUser, unbanUser } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Check if already banned
    if (user.is_banned) {
      return NextResponse.json(
        { error: 'User is already banned' },
        { status: 400 }
      );
    }

    // Parse request body for ban reason
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body or invalid JSON, proceed without reason
    }

    // Ban the user
    const success = banUser(jid, reason);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to ban user' },
        { status: 500 }
      );
    }

    // Get updated user
    const updatedUser = getUserByJid(jid);

    return NextResponse.json({
      success: true,
      message: 'User banned successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
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

    // Check if not banned
    if (!user.is_banned) {
      return NextResponse.json(
        { error: 'User is not banned' },
        { status: 400 }
      );
    }

    // Unban the user
    const success = unbanUser(jid);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unban user' },
        { status: 500 }
      );
    }

    // Get updated user
    const updatedUser = getUserByJid(jid);

    return NextResponse.json({
      success: true,
      message: 'User unbanned successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json(
      { error: 'Failed to unban user' },
      { status: 500 }
    );
  }
}
