import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readMessages, appendMessage, deleteMessage, getMessageById } from '@/lib/storage';
import { Message } from '@/types';
import { broadcastNewMessages, broadcastMessageDeleted } from '@/lib/messageBroadcast';

// Simple UUID generator if uuid package not available
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = await readMessages();
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, gifUrl, attachments, replyToId } = body;

    if (!message && !gifUrl && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message, GIF, or attachment is required' },
        { status: 400 }
      );
    }

    // Validate replyToId if provided
    if (replyToId) {
      const originalMessage = await getMessageById(replyToId);
      if (!originalMessage) {
        return NextResponse.json(
          { error: 'Original message not found' },
          { status: 404 }
        );
      }
    }

    const newMessage: Message = {
      id: generateId(),
      username: session.username,
      message: message || '',
      timestamp: Date.now(),
      gifUrl,
      attachments: attachments || [],
      replyToId: replyToId || undefined,
    };

    await appendMessage(newMessage);
    
    // Broadcast to SSE clients (non-blocking)
    broadcastNewMessages().catch(console.error);

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteMessage(messageId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Broadcast deletion to SSE clients (non-blocking)
    broadcastMessageDeleted(messageId);

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

