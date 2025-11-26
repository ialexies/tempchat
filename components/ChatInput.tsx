'use client';

import { useState, useRef, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import { Message } from '@/types';
import { getAvatarData } from '@/lib/avatar';

interface ChatInputProps {
  onSendMessage: (message: string, gifUrl?: string, attachments?: any[], replyToId?: string) => void;
  onFileUpload: (file: File) => Promise<any>;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export default function ChatInput({ onSendMessage, onFileUpload, replyingTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, undefined, attachments, replyingTo?.id);
      setMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      onCancelReply?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    onSendMessage('', gifUrl, [], replyingTo?.id);
    setShowGifPicker(false);
    onCancelReply?.();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const uploadedFile = await onFileUpload(file);
        setAttachments(prev => [...prev, uploadedFile]);
      } catch (error) {
        console.error('File upload error:', error);
        alert('Failed to upload file');
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = 'auto';
      const maxHeight = 150; // ~6-7 lines
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(scrollHeight, maxHeight);
      
      // Set the height
      textarea.style.height = `${newHeight}px`;
      
      // Enable scrolling if content exceeds max height
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [message]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setShowActionMenu(false);
  };

  const handleInputBlur = () => {
    // Delay to allow menu clicks
    setTimeout(() => {
      setIsInputFocused(false);
      setShowActionMenu(false);
    }, 200);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    
    // Check if clipboard contains image data
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        
        const file = item.getAsFile();
        if (!file) return;
        
        try {
          const uploadedFile = await onFileUpload(file);
          setAttachments(prev => [...prev, uploadedFile]);
        } catch (error) {
          console.error('Paste image upload error:', error);
          alert('Failed to upload pasted image');
        }
        return;
      }
    }
  };

  const handleMenuAction = (action: 'emoji' | 'gif' | 'attach') => {
    setShowActionMenu(false);
    if (action === 'emoji') {
      setShowEmojiPicker(!showEmojiPicker);
      setShowGifPicker(false);
    } else if (action === 'gif') {
      setShowGifPicker(!showGifPicker);
      setShowEmojiPicker(false);
    } else if (action === 'attach') {
      fileInputRef.current?.click();
    }
  };

  const replyAvatar = replyingTo ? getAvatarData(replyingTo.username) : null;
  const replyPreviewText = replyingTo 
    ? (replyingTo.message 
        ? (replyingTo.message.length > 100 ? replyingTo.message.substring(0, 100) + '...' : replyingTo.message)
        : replyingTo.gifUrl 
          ? 'GIF' 
          : replyingTo.attachments && replyingTo.attachments.length > 0
            ? `📎 ${replyingTo.attachments[0].originalName}`
            : 'Message')
    : '';

  return (
    <div className="border-t border-chat-border bg-white shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
        {/* Reply preview banner */}
        {replyingTo && replyAvatar && (
          <div className="mb-2 sm:mb-3 flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-2 sm:px-3 py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                style={{ backgroundColor: replyAvatar.color }}
              >
                {replyAvatar.initials}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-xs font-semibold text-primary-700 line-clamp-1">Replying to {replyingTo.username}</div>
                <div className="text-xs text-gray-600 line-clamp-1">{replyPreviewText}</div>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cancel reply"
              title="Cancel reply"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {attachments.length > 0 && (
          <div className="mb-2 sm:mb-3 flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div
                key={index}
                className="group relative inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 pr-7 sm:pr-8 shadow-soft hover:shadow-medium transition-all"
              >
                <span className="text-base sm:text-lg">📎</span>
                <span className="truncate max-w-[100px] sm:max-w-[120px] md:max-w-xs text-xs sm:text-sm text-gray-700 font-medium">
                  {att.originalName}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Remove attachment"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-chat-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm sm:text-base transition-all shadow-soft focus:shadow-medium resize-none min-h-[44px] max-h-[150px]"
            />
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-20 animate-fade-in">
                <EmojiPicker onSelect={handleEmojiSelect} />
              </div>
            )}
            {showGifPicker && (
              <div className="absolute bottom-full mb-2 left-0 z-20 animate-fade-in">
                <GifPicker onSelect={handleGifSelect} />
              </div>
            )}
          </div>
          
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile: Collapsed Menu Button (only when input is focused) */}
            {isInputFocused && (
              <div className="sm:hidden relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowActionMenu(!showActionMenu);
                  }}
                  className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-soft hover:shadow-medium active:scale-95 ${
                    showActionMenu
                      ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                  }`}
                  title="More options"
                  aria-label="More options"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {/* Action Menu Dropdown */}
                {showActionMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[140px] animate-fade-in">
                    <button
                      type="button"
                      onClick={() => handleMenuAction('emoji')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="text-lg">😀</span>
                      <span>Emoji</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMenuAction('gif')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="text-lg">🎬</span>
                      <span>GIF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMenuAction('attach')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="text-lg">📎</span>
                      <span>Attach</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Desktop: Always show individual buttons */}
            {/* Mobile: Show when input is NOT focused */}
            <div className={`${isInputFocused ? 'hidden' : 'flex'} sm:flex gap-1.5 sm:gap-2`}>
              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
                className={`w-11 h-11 flex items-center justify-center text-xl sm:text-2xl rounded-xl transition-all shadow-soft hover:shadow-medium active:scale-95 ${
                  showEmojiPicker
                    ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
                title="Emoji"
                aria-label="Emoji picker"
              >
                😀
              </button>
              
              {/* GIF Button */}
              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                }}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-soft hover:shadow-medium active:scale-95 ${
                  showGifPicker
                    ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
                title="GIF"
                aria-label="GIF picker"
              >
                <span className="text-lg sm:text-xl">🎬</span>
                <span className="hidden md:inline ml-1.5 text-xs font-semibold">GIF</span>
              </button>
              
              {/* Attach File Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 flex items-center justify-center text-lg sm:text-xl bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all shadow-soft hover:shadow-medium active:scale-95"
                title="Attach file"
                aria-label="Attach file"
              >
                📎
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File input"
            />
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() && attachments.length === 0}
              className="px-3 sm:px-4 md:px-6 h-11 bg-primary-500 text-white rounded-xl hover:bg-primary-600 active:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition-all shadow-soft hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500 disabled:active:scale-100 active:scale-95 text-sm sm:text-base font-medium"
              aria-label="Send message"
            >
              <span className="hidden md:inline">Send</span>
              <span className="md:hidden">➤</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

