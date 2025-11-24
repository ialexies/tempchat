import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { readMessages } from '@/lib/storage';
import { getMessageClients } from '@/lib/messageBroadcast';

// Get the messageClients map
const messageClients = getMessageClients();

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Initialize message count for this client
  const messages = await readMessages();
  const initialMessageCount = messages.length;

  const stream = new ReadableStream({
    start(controller) {
      // Store this client with its initial message count
      messageClients.set(controller, initialMessageCount);

      // Send initial connection message
      controller.enqueue(new TextEncoder().encode(': connected\n\n'));

      // Poll for new messages every 1 second
      const pollInterval = setInterval(async () => {
        try {
          const currentMessages = await readMessages();
          const clientLastCount = messageClients.get(controller) || initialMessageCount;
          
          if (currentMessages.length > clientLastCount) {
            const newMessages = currentMessages.slice(clientLastCount);
            const data = JSON.stringify({ messages: newMessages });
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            messageClients.set(controller, currentMessages.length);
          } else {
            // Send keepalive
            controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
          }
        } catch (error) {
          clearInterval(pollInterval);
          messageClients.delete(controller);
        }
      }, 1000); // Check every 1 second

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        messageClients.delete(controller);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

