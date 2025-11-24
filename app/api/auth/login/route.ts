import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, setSession } from '@/lib/auth';
import { initializeUsers } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    await initializeUsers();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    await setSession(username);

    // Create response with success message
    const response = NextResponse.json({ success: true, username });
    
    // Ensure cookie is set (it should already be set by setSession, but this ensures it's in the response)
    // The cookie is automatically added by Next.js cookies() API
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

