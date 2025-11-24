import { GiphyResponse } from '@/types';

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

export async function searchGifs(query: string, limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
  if (!GIPHY_API_KEY) {
    throw new Error('Giphy API key not configured');
  }

  const url = `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getTrendingGifs(limit: number = 20, offset: number = 0): Promise<GiphyResponse> {
  if (!GIPHY_API_KEY) {
    throw new Error('Giphy API key not configured');
  }

  const url = `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.statusText}`);
  }
  
  return response.json();
}

