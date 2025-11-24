import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { readUsers } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'temp-secret-key-change-in-production';
const COOKIE_NAME = 'chat-session';

export interface SessionData {
  username: string;
}

// Verify password
export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const users = await readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return false;
  
  // Use bcrypt to verify password
  return bcrypt.compareSync(password, user.passwordHash);
}

// Create session token
export function createSession(username: string): string {
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  return token;
}

// Verify session token
export function verifySession(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch {
    return null;
  }
}

// Get current session
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

// Set session cookie
export async function setSession(username: string): Promise<void> {
  const token = createSession(username);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Clear session
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

