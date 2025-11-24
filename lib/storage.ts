import { promises as fs } from 'fs';
import path from 'path';
import { User, Message } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Initialize users file if it doesn't exist
export async function initializeUsers(): Promise<void> {
  await ensureDataDir();
  try {
    await fs.access(USERS_FILE);
  } catch {
    // File doesn't exist, create default users with bcrypt hashes
    const bcrypt = await import('bcryptjs');
    const defaultUsers: User[] = [
      {
        username: 'user1',
        passwordHash: bcrypt.default.hashSync('user1pass', 10),
      },
      {
        username: 'user2',
        passwordHash: bcrypt.default.hashSync('user2pass', 10),
      },
      {
        username: 'user3',
        passwordHash: bcrypt.default.hashSync('user3pass', 10),
      },
      {
        username: 'alex',
        passwordHash: bcrypt.default.hashSync('user1pass', 10),
      },
    ];
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

// Read users from file
export async function readUsers(): Promise<User[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    await initializeUsers();
    return readUsers();
  }
}

// Read messages from file
export async function readMessages(): Promise<Message[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Append message to file
export async function appendMessage(message: Message): Promise<void> {
  await ensureDataDir();
  const messages = await readMessages();
  messages.push(message);
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Get uploads directory path
export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

// Get file path in uploads directory
export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

