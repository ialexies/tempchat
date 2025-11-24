import { NextRequest, NextResponse } from 'next/server';
import { searchGifs } from '@/lib/giphy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const result = await searchGifs(query, limit, offset);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Giphy search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search GIFs' },
      { status: 500 }
    );
  }
}

