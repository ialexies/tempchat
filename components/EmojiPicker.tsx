'use client';

import { useState } from 'react';
import EmojiPickerReact from 'emoji-picker-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const handleEmojiClick = (emojiData: any) => {
    onSelect(emojiData.emoji);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        width={350}
        height={400}
      />
    </div>
  );
}

