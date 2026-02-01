import { NextResponse } from 'next/server';
import { getMessagesByJid, getUserByJid } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/messages/:jid
 * Returns messages for a specific conversation (JID)
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: jid } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Decode JID (it may be URL encoded)
    const decodedJid = decodeURIComponent(jid);

    // Get messages for this JID
    const result = getMessagesByJid(decodedJid, { page, limit });

    // Get contact info
    const user = getUserByJid(decodedJid);
    const contact = {
      jid: decodedJid,
      name: user?.name || null,
      phone: user?.phone || decodedJid.split('@')[0],
    };

    return NextResponse.json({
      messages: result.data,
      contact,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasMore: result.page < result.totalPages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
