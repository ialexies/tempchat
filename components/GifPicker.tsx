'use client';

import { useState, useEffect } from 'react';
import { GiphyGif } from '@/types';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export default function GifPicker({ onSelect }: GifPickerProps) {
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrendingGifs();
  }, []);

  const loadTrendingGifs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/giphy/trending');
      if (!response.ok) throw new Error('Failed to load GIFs');
      const data = await response.json();
      setGifs(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load GIFs');
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/giphy/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search GIFs');
      const data = await response.json();
      setGifs(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search GIFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(searchQuery);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-96 max-h-96 flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        )}
        {!loading && !error && gifs.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No GIFs found</div>
        )}
        {!loading && !error && gifs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="relative aspect-square overflow-hidden rounded hover:ring-2 hover:ring-indigo-500 transition-all"
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

