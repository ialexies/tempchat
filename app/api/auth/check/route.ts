import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (session) {
    return NextResponse.json({ username: session.username });
  }
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}

