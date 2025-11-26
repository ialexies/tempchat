'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load GIFs (${response.status})`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setGifs(data.data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load GIFs. Please check if GIPHY API key is configured.';
      setError(errorMessage);
      console.error('GIF loading error:', err);
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to search GIFs (${response.status})`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setGifs(data.data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to search GIFs. Please check if GIPHY API key is configured.';
      setError(errorMessage);
      console.error('GIF search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchGifs(searchQuery);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] sm:max-h-96 flex flex-col">
      <div className="p-2 sm:p-3 border-b border-gray-200">
        <div className="flex gap-1.5 sm:gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search GIFs..."
            className="flex-1 px-2 sm:px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-2.5 sm:px-3 py-1.5 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 active:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 sm:p-3">
        {loading && (
          <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
        )}
        {error && (
          <div className="text-center py-4 px-3">
            <div className="text-rose-500 text-sm font-medium mb-1">{error}</div>
            <div className="text-xs text-gray-500">
              {error.includes('API key') && (
                <span>Please configure NEXT_PUBLIC_GIPHY_API_KEY in your environment variables.</span>
              )}
            </div>
          </div>
        )}
        {!loading && !error && gifs.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No GIFs found</div>
        )}
        {!loading && !error && gifs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="relative aspect-square overflow-hidden rounded hover:ring-2 hover:ring-primary-500 active:ring-2 active:ring-primary-500 transition-all"
              >
                <Image
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  width={parseInt(gif.images.fixed_height.width, 10)}
                  height={parseInt(gif.images.fixed_height.height, 10)}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

