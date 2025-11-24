import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { readUsers } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'temp-secret-key-change-in-production';
const COOKIE_NAME = 'chat-session';

// Hardcoded admin account
const ADMIN_USERNAME = 'ialexies';
const ADMIN_PASSWORD = '*Luffy123';

// Generate admin password hash (bcrypt with salt rounds 10)
// We generate it once and cache it, or compare directly
function getAdminPasswordHash(): string {
  // Generate hash synchronously - this is safe for a hardcoded password
  return bcrypt.hashSync(ADMIN_PASSWORD, 10);
}

// Cache the hash to avoid regenerating it every time
let adminPasswordHashCache: string | null = null;
function getCachedAdminHash(): string {
  if (!adminPasswordHashCache) {
    adminPasswordHashCache = getAdminPasswordHash();
  }
  return adminPasswordHashCache;
}

export interface SessionData {
  username: string;
  isAdmin?: boolean;
}

// Check if user is admin (hardcoded or from database)
export async function isAdmin(username: string): Promise<boolean> {
  if (username === ADMIN_USERNAME) {
    return true;
  }
  
  const users = await readUsers();
  const user = users.find(u => u.username === username);
  return user?.isAdmin === true;
}

// Verify password (check hardcoded admin first, then database)
export async function verifyPassword(username: string, password: string): Promise<boolean> {
  // Check hardcoded admin first
  if (username === ADMIN_USERNAME) {
    // For admin, we can compare directly or use the cached hash
    // Since password is hardcoded, we generate hash and compare
    const hash = getCachedAdminHash();
    return bcrypt.compareSync(password, hash);
  }
  
  // Check database users
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
  
  const session = verifySession(token);
  if (!session) return null;
  
  // Add admin status to session
  const adminStatus = await isAdmin(session.username);
  return {
    ...session,
    isAdmin: adminStatus,
  };
}

// Set session cookie
export async function setSession(username: string): Promise<void> {
  const token = createSession(username);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/', // Ensure cookie is available site-wide
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Clear session
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

