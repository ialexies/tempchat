import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readMessages, appendMessage } from '@/lib/storage';
import { Message } from '@/types';
import { broadcastNewMessages } from '@/lib/messageBroadcast';

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
    const { message, gifUrl, attachments } = body;

    if (!message && !gifUrl && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message, GIF, or attachment is required' },
        { status: 400 }
      );
    }

    const newMessage: Message = {
      id: generateId(),
      username: session.username,
      message: message || '',
      timestamp: Date.now(),
      gifUrl,
      attachments: attachments || [],
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

