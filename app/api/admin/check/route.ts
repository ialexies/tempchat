import { NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const adminStatus = await isAdmin(session.username);
  return NextResponse.json({ isAdmin: adminStatus });
}

