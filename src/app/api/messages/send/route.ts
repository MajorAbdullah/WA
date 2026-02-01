import { NextResponse } from 'next/server';
import { createMessage, upsertUser, incrementUserMessageCount } from '@/lib/db/queries';
import { sendTextMessage } from '@/lib/bot/adapter';
import { socketManager } from '@/lib/socket/server';

export const dynamic = 'force-dynamic';

interface SendMessageBody {
  jid: string;
  text: string;
  type?: 'text' | 'image';
}

/**
 * POST /api/messages/send
 * Send a message to a specific JID
 */
export async function POST(request: Request) {
  try {
    const body: SendMessageBody = await request.json();

    // Validate request body
    if (!body.jid || typeof body.jid !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid jid' },
        { status: 400 }
      );
    }

    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text' },
        { status: 400 }
      );
    }

    const jid = body.jid.trim();
    const text = body.text.trim();
    const type = body.type || 'text';

    // Generate message ID
    const messageId = `out_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = Date.now();

    // Create message in database first
    const message = createMessage({
      id: messageId,
      jid,
      from_me: true,
      content: text,
      type,
      timestamp,
      status: 'pending',
    });

    // Ensure user exists in database
    upsertUser({
      jid,
      first_seen: timestamp,
      last_seen: timestamp,
    });

    // Increment message count for the user
    incrementUserMessageCount(jid);

    // Send message via bot adapter
    try {
      await sendTextMessage(jid, text);

      // Update message status to sent
      message.status = 'sent';
    } catch (sendError) {
      console.error('Error sending message via bot:', sendError);
      message.status = 'failed';
    }

    // Emit to connected clients via WebSocket
    try {
      socketManager.emitOutgoingMessage(message);
    } catch {
      // Socket not available, ignore
    }

    return NextResponse.json({
      success: message.status === 'sent',
      messageId: message.id,
      message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
