import { NextResponse } from 'next/server';
import { getMessages } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/messages/search?q=query
 * Search messages by content
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!query.trim()) {
      return NextResponse.json({
        messages: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      });
    }

    // Search messages with the query filter
    const result = getMessages({ search: query.trim() }, { page, limit });

    return NextResponse.json({
      messages: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      query: query.trim(),
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
