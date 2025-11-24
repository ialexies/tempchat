import { readMessages } from './storage';

// Use a Map to store clients with their last message count
const messageClients = new Map<ReadableStreamDefaultController, number>();

// Broadcast new messages to all connected clients
export async function broadcastNewMessages() {
  const messages = await readMessages();
  const currentMessageCount = messages.length;
  
  messageClients.forEach((lastCount, client) => {
    if (currentMessageCount > lastCount) {
      const newMessages = messages.slice(lastCount);
      const data = JSON.stringify({ messages: newMessages });
      
      try {
        client.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        // Update the last message count for this client
        messageClients.set(client, currentMessageCount);
      } catch (error) {
        // Client disconnected, remove from map
        messageClients.delete(client);
      }
    }
  });
}

// Get the messageClients map for use in stream route
export function getMessageClients() {
  return messageClients;
}




