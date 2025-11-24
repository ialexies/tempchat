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
    <div className="border-t border-gray-200 bg-white p-4">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, index) => (
            <div key={index} className="relative inline-block">
              <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-sm">
                <span className="truncate max-w-xs">{att.originalName}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onFocus={() => {
              setShowEmojiPicker(false);
              setShowGifPicker(false);
            }}
          />
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-10">
              <EmojiPicker onSelect={handleEmojiSelect} />
            </div>
          )}
          {showGifPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-10">
              <GifPicker onSelect={handleGifSelect} />
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
            }}
            className="px-3 py-2 text-xl hover:bg-gray-100 rounded-lg transition-colors"
            title="Emoji"
          >
            😀
          </button>
          
          <button
            type="button"
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
            className="px-3 py-2 text-sm font-semibold hover:bg-gray-100 rounded-lg transition-colors"
            title="GIF"
          >
            GIF
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Attach file"
          >
            📎
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

