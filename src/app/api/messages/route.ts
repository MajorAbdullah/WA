import { NextResponse } from 'next/server';
import { getConversations, getUserByJid } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/messages
 * Returns list of conversations (unique JIDs with their latest message)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get conversations from database
    const result = getConversations({ page, limit });

    // Enrich with user data
    const conversations = result.data.map((conv) => {
      const user = getUserByJid(conv.jid);
      return {
        jid: conv.jid,
        name: user?.name || null,
        phone: user?.phone || conv.jid.split('@')[0],
        lastMessage: conv.lastMessage,
        messageCount: conv.messageCount,
        unreadCount: 0, // TODO: Implement unread tracking
      };
    });

    return NextResponse.json({
      conversations,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
