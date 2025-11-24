'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Message, Attachment } from '@/types';
import ChatInput from '@/components/ChatInput';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Check authentication
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setUsername(data.username);
          loadMessages();
          // Use polling for reliable real-time updates (works better in serverless)
          cleanup = startPolling();
        } else {
          router.push('/');
        }
      })
      .catch(() => {
        router.push('/');
      });
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    try {
      const eventSource = new EventSource('/api/messages/stream');
      
      eventSource.onmessage = (event) => {
        // Handle keepalive messages
        if (event.data.startsWith(': ')) {
          return;
        }
        
        // Handle data messages
        if (event.data.startsWith('data: ')) {
          try {
            const data = JSON.parse(event.data.substring(6));
            if (data.messages && Array.isArray(data.messages)) {
              setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = data.messages.filter((m: Message) => !existingIds.has(m.id));
                if (newMessages.length > 0) {
                  return [...prev, ...newMessages];
                }
                return prev;
              });
            }
          } catch (error) {
            console.error('SSE parse error:', error);
          }
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        // Fallback to polling if SSE fails
        startPolling();
      };

      // Return cleanup function
      return () => {
        eventSource.close();
      };
    } catch (error) {
      console.error('Failed to setup SSE:', error);
      // Fallback to polling
      return startPolling();
    }
  };

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        if (data.messages) {
          // Only update if messages changed (avoid unnecessary re-renders)
          setMessages(prev => {
            if (prev.length !== data.messages.length || 
                prev[prev.length - 1]?.id !== data.messages[data.messages.length - 1]?.id) {
              return data.messages;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1500); // Poll every 1.5 seconds for near real-time
    
    return () => clearInterval(pollInterval);
  };

  const handleSendMessage = async (message: string, gifUrl?: string, attachments?: Attachment[]) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, gifUrl, attachments }),
      });

      const data = await response.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const handleFileUpload = async (file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success && data.file) {
      return data.file;
    }
    throw new Error(data.error || 'Upload failed');
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">TempChat</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Logged in as: <strong>{username}</strong></span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md rounded-lg px-4 py-2 ${
                msg.username === username
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-80">
                {msg.username} • {formatTime(msg.timestamp)}
              </div>
              
              {msg.gifUrl && (
                <div className="mb-2">
                  <img
                    src={msg.gifUrl}
                    alt="GIF"
                    className="max-w-full rounded"
                  />
                </div>
              )}
              
              {msg.message && (
                <div className="whitespace-pre-wrap break-words">{msg.message}</div>
              )}
              
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.attachments.map((att, index) => (
                    <div key={index} className="border-t border-opacity-20 pt-2 mt-2">
                      {att.mimeType?.startsWith('image/') ? (
                        <img
                          src={att.url}
                          alt={att.originalName}
                          className="max-w-full rounded"
                        />
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline hover:opacity-80"
                        >
                          📎 {att.originalName} ({(att.size / 1024).toFixed(1)} KB)
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} />
    </div>
  );
}

