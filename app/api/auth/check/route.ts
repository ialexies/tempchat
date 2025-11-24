import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (session) {
    return NextResponse.json({ 
      username: session.username,
      isAdmin: session.isAdmin || false,
      authenticated: true
    });
  }
  // Return 200 with authenticated: false to avoid console errors
  // This is expected behavior when checking auth status
  return NextResponse.json({ 
    authenticated: false 
  });
}

