import { NextRequest, NextResponse } from 'next/server';
import { getTrendingGifs } from '@/lib/giphy';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const result = await getTrendingGifs(limit, offset);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Giphy trending error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load trending GIFs' },
      { status: 500 }
    );
  }
}

