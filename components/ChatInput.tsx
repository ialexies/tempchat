'use client';

import { useState, useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';

interface ChatInputProps {
  onSendMessage: (message: string, gifUrl?: string, attachments?: any[]) => void;
  onFileUpload: (file: File) => Promise<any>;
}

export default function ChatInput({ onSendMessage, onFileUpload }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message, undefined, attachments);
      setMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    onSendMessage('', gifUrl);
    setShowGifPicker(false);
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

  return (
    <div className="border-t border-chat-border bg-white shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div
                key={index}
                className="group relative inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 shadow-soft hover:shadow-medium transition-all"
              >
                <span className="text-lg">📎</span>
                <span className="truncate max-w-[120px] sm:max-w-xs text-sm text-gray-700 font-medium">
                  {att.originalName}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Remove attachment"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-chat-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm sm:text-base transition-all shadow-soft focus:shadow-medium"
              onFocus={() => {
                setShowEmojiPicker(false);
                setShowGifPicker(false);
              }}
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
          
          <div className="flex gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-xl sm:text-2xl rounded-xl transition-all shadow-soft hover:shadow-medium ${
                showEmojiPicker
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
              title="Emoji"
              aria-label="Emoji picker"
            >
              😀
            </button>
            
            <button
              type="button"
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
              }}
              className={`hidden sm:flex items-center justify-center px-3 sm:px-4 h-10 sm:h-11 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-soft hover:shadow-medium ${
                showGifPicker
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
              title="GIF"
              aria-label="GIF picker"
            >
              GIF
            </button>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-lg sm:text-xl bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all shadow-soft hover:shadow-medium"
              title="Attach file"
              aria-label="Attach file"
            >
              📎
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File input"
            />
            
            <button
              type="submit"
              disabled={!message.trim() && attachments.length === 0}
              className="px-4 sm:px-6 h-10 sm:h-11 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-soft hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 text-sm sm:text-base font-medium"
              aria-label="Send message"
            >
              <span className="hidden sm:inline">Send</span>
              <span className="sm:hidden">➤</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

