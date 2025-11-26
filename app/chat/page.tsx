'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Message, Attachment } from '@/types';
import ChatInput from '@/components/ChatInput';
import { getAvatarData } from '@/lib/avatar';
import {
  requestNotificationPermission,
  showNotification,
  updateDocumentTitle,
  isTabVisible,
} from '@/lib/notifications';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastViewedTimestampRef = useRef<number>(Date.now());
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Check authentication
    fetch('/api/auth/check', {
      credentials: 'include', // Ensure cookies are sent
    })
      .then(res => res.json())
      .then(data => {
        // Check if user is authenticated
        if (data?.authenticated && data?.username) {
          setUsername(data.username);
          setIsAdmin(data.isAdmin || false);
          loadMessages();
          // Check current notification permission status
          if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
          }
          // Use polling for reliable real-time updates (works better in serverless)
          cleanup = startPolling();
        } else {
          // Not authenticated, redirect to login
          router.push('/');
        }
      })
      .catch(() => {
        // Network error, redirect to login
        router.push('/');
      });
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);

  useEffect(() => {
    scrollToBottom();
    // Update last viewed timestamp when messages change and tab is focused
    if (isTabFocused && messages.length > 0) {
      lastViewedTimestampRef.current = messages[messages.length - 1].timestamp;
    }
  }, [messages, isTabFocused]);

  // Check notification permission status on mount and when it might change
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Track tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = isTabVisible();
      setIsTabFocused(visible);
      
      // When tab becomes visible, reset unread count and update last viewed timestamp
      if (visible) {
        setUnreadCount(0);
        if (messages.length > 0) {
          lastViewedTimestampRef.current = messages[messages.length - 1].timestamp;
        }
        updateDocumentTitle(0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsTabFocused(isTabVisible());

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages]);

  // Update document title when unread count changes
  useEffect(() => {
    updateDocumentTitle(unreadCount);
  }, [unreadCount]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        // Set initial last viewed timestamp
        if (data.messages.length > 0) {
          lastViewedTimestampRef.current = data.messages[data.messages.length - 1].timestamp;
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle new messages and show notifications
  const handleNewMessages = (newMessages: Message[], previousMessages: Message[]) => {
    if (newMessages.length === 0) return;

    const previousIds = new Set(previousMessages.map(m => m.id));
    const actualNewMessages = newMessages.filter(m => !previousIds.has(m.id));

    if (actualNewMessages.length === 0) return;

    // Filter out own messages and messages before last viewed timestamp
    const unreadMessages = actualNewMessages.filter(msg => {
      const isFromOtherUser = msg.username !== username;
      const isAfterLastViewed = msg.timestamp > lastViewedTimestampRef.current;
      return isFromOtherUser && isAfterLastViewed;
    });

    if (unreadMessages.length === 0) return;

    // Check if tab is focused at the moment (real-time check)
    const tabIsCurrentlyFocused = isTabVisible();
    
    // If tab is not focused, show notifications and update unread count
    if (!tabIsCurrentlyFocused) {
      // Show notification for each new message from other users
      unreadMessages.forEach(msg => {
        let messageText = '';
        if (msg.message) {
          messageText = msg.message;
        } else if (msg.gifUrl) {
          messageText = 'Sent a GIF';
        } else if (msg.attachments && msg.attachments.length > 0) {
          messageText = `Sent ${msg.attachments.length} attachment${msg.attachments.length > 1 ? 's' : ''}`;
        } else {
          messageText = 'Sent a message';
        }
        showNotification(msg.username, messageText);
      });

      // Update unread count (document title will be updated via useEffect)
      setUnreadCount(prev => prev + unreadMessages.length);
    } else {
      // Tab is focused - user is actively viewing, so no notification needed
      // But still update unread count for title badge (in case user switches back quickly)
      setUnreadCount(prev => prev + unreadMessages.length);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Show a test notification
        showNotification('TempChat', 'Notifications enabled! You will now receive alerts for new messages.');
      } else if (permission === 'denied') {
        alert('Notification permission was denied. Please enable it in your browser settings to receive notifications.');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
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
                  const updated = [...prev, ...newMessages];
                  handleNewMessages(updated, prev);
                  return updated;
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
          // Update if messages changed (length, last message, or any message IDs differ)
          setMessages(prev => {
            const prevIds = new Set<string>(prev.map(m => m.id));
            const newIds = new Set<string>(data.messages.map((m: Message) => m.id));
            
            // Check if any IDs differ (additions or deletions)
            if (prev.length !== data.messages.length || 
                prev[prev.length - 1]?.id !== data.messages[data.messages.length - 1]?.id ||
                prevIds.size !== newIds.size ||
                Array.from(prevIds).some(id => !newIds.has(id)) ||
                Array.from(newIds).some(id => !prevIds.has(id))) {
              handleNewMessages(data.messages, prev);
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
        setMessages(prev => {
          const updated = [...prev, data.message];
          // Update last viewed timestamp for own messages
          lastViewedTimestampRef.current = data.message.timestamp;
          return updated;
        });
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAdmin) return;
    
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages?id=${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        // Remove message from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        alert(data.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  const userAvatar = getAvatarData(username);

  return (
    <div className="flex flex-col h-screen bg-chat-background">
      {/* Header */}
      <div className="bg-white border-b border-chat-border shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">TempChat</h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Notification Permission Button */}
              {notificationPermission !== 'granted' && 'Notification' in window && (
                <button
                  onClick={handleRequestNotificationPermission}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-soft hover:shadow-medium"
                  title="Enable notifications"
                  aria-label="Enable notifications"
                >
                  <span className="hidden sm:inline">🔔 Enable Notifications</span>
                  <span className="sm:hidden">🔔</span>
                </button>
              )}

              {/* User Info - Hidden on mobile, visible on tablet+ */}
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                <div
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-semibold shadow-medium flex-shrink-0"
                  style={{ backgroundColor: userAvatar.color }}
                >
                  {userAvatar.initials}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs text-gray-500">Logged in as</div>
                  <div className="text-sm font-semibold text-gray-800">{username}</div>
                </div>
                <div className="sm:block md:hidden text-sm text-gray-700 font-medium">
                  {username}
                </div>
              </div>

              {/* Mobile: Just avatar */}
              <div className="sm:hidden">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-medium"
                  style={{ backgroundColor: userAvatar.color }}
                >
                  {userAvatar.initials}
                </div>
              </div>

              {/* Admin Panel Button */}
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 shadow-soft hover:shadow-medium text-sm sm:text-base font-medium"
                  aria-label="Admin Panel"
                >
                  <span className="hidden sm:inline">Admin Panel</span>
                  <span className="sm:hidden">⚙️</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 shadow-soft hover:shadow-medium text-sm sm:text-base font-medium"
                aria-label="Logout"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No messages yet</h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-sm">Start the conversation by sending a message!</p>
            </div>
          )}
          {messages.map((msg, index) => {
            const isOwnMessage = msg.username === username;
            const msgAvatar = getAvatarData(msg.username);
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar = !prevMessage || prevMessage.username !== msg.username;
            const timeDiff = prevMessage ? msg.timestamp - prevMessage.timestamp : Infinity;
            const showTimeSeparator = timeDiff > 300000; // 5 minutes

            return (
              <div key={msg.id}>
                {showTimeSeparator && index > 0 && (
                  <div className="flex items-center justify-center my-4 sm:my-6">
                    <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {new Date(msg.timestamp).toLocaleDateString()} {formatTime(msg.timestamp)}
                    </div>
                  </div>
                )}
                <div
                  className={`flex gap-2 sm:gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} message-enter`}
                >
                  {/* Avatar - Only show for other users' messages, and only when it's a new user */}
                  {!isOwnMessage && showAvatar && (
                    <div className="flex-shrink-0">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-medium"
                        style={{ backgroundColor: msgAvatar.color }}
                      >
                        {msgAvatar.initials}
                      </div>
                    </div>
                  )}
                  {!isOwnMessage && !showAvatar && <div className="w-8 sm:w-10 flex-shrink-0" />}

                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] md:max-w-[60%] group`}>
                    {/* Username, timestamp, and delete button */}
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1 px-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <div className={`text-xs text-gray-500 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          <span className="font-semibold">{msg.username}</span>
                          <span className="mx-1">•</span>
                          <span>{formatTime(msg.timestamp)}</span>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            aria-label="Delete message"
                            title="Delete message"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`relative rounded-2xl ${
                        msg.gifUrl && !msg.message && (!msg.attachments || msg.attachments.length === 0)
                          ? ''
                          : 'px-3 py-2 sm:px-4 sm:py-2.5'
                      } ${
                        isOwnMessage
                          ? 'bg-primary-600 text-white rounded-br-md shadow-none outline-none border-0'
                          : 'bg-white text-gray-800 border border-chat-border rounded-bl-md shadow-message'
                      }`}
                    >
                      {/* Delete button for messages without avatar (grouped messages) */}
                      {isAdmin && !showAvatar && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-medium z-10"
                          aria-label="Delete message"
                          title="Delete message"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {msg.gifUrl && (
                        <div className={`relative w-full ${msg.message || (msg.attachments && msg.attachments.length > 0) ? 'mb-2 last:mb-0' : ''}`}>
                          <img
                            src={msg.gifUrl}
                            alt="GIF"
                            className={`w-full h-auto ${
                              msg.message || (msg.attachments && msg.attachments.length > 0)
                                ? 'rounded-lg'
                                : isOwnMessage
                                  ? 'rounded-2xl rounded-br-md'
                                  : 'rounded-2xl rounded-bl-md'
                            }`}
                            style={{ maxWidth: '100%', height: 'auto' }}
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {msg.message && (
                        <div className={`whitespace-pre-wrap break-words text-sm sm:text-base ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                          {msg.message}
                        </div>
                      )}
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att, attIndex) => (
                            <div key={attIndex} className={attIndex > 0 ? 'border-t border-opacity-20 pt-2 mt-2' : ''}>
                              {att.mimeType?.startsWith('image/') ? (
                                <div className="relative w-full">
                                  <Image
                                    src={att.url}
                                    alt={att.originalName}
                                    width={800}
                                    height={600}
                                    className="max-w-full rounded-lg shadow-soft"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-sm sm:text-base flex items-center gap-2 hover:opacity-80 transition-opacity ${
                                    isOwnMessage ? 'text-white' : 'text-primary-600'
                                  }`}
                                >
                                  <span>📎</span>
                                  <span className="truncate">{att.originalName}</span>
                                  <span className="text-xs opacity-75">({(att.size / 1024).toFixed(1)} KB)</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spacer for own messages */}
                  {isOwnMessage && <div className="w-8 sm:w-10 flex-shrink-0" />}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} />
    </div>
  );
}

