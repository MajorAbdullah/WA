/**
 * Users API Route
 * GET /api/users - List all users with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserCount } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const bannedParam = searchParams.get('banned');
    const is_banned = bannedParam === 'true' ? true : bannedParam === 'false' ? false : undefined;

    // Validate pagination
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // Get users from database
    const result = getUsers(
      { search, is_banned },
      { page: validPage, limit: validLimit }
    );

    // Get counts for stats
    const totalUsers = getUserCount();
    const bannedUsers = getUserCount(true);

    return NextResponse.json({
      users: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats: {
        totalUsers,
        bannedUsers,
        activeUsers: totalUsers - bannedUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
