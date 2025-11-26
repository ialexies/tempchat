import { promises as fs } from 'fs';
import path from 'path';
import { User, Message, Attachment } from '@/types';
import { getDb } from './db';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(process.cwd(), 'data');
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

// Initialize database and migrate if needed
async function initializeDatabase() {
  await ensureDataDir();
  const db = getDb();
  
  // Check if database is empty and JSON files exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    // Check for JSON files to migrate
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
    
    let hasJsonFiles = false;
    try {
      await fs.access(USERS_FILE);
      hasJsonFiles = true;
    } catch {
      // No users.json
    }
    
    try {
      await fs.access(MESSAGES_FILE);
      hasJsonFiles = true;
    } catch {
      // No messages.json
    }
    
    if (hasJsonFiles) {
      // Run migration inline
      try {
        await migrateJsonToSqlite(db);
      } catch (error) {
        console.error('Migration failed, continuing with empty database:', error);
        // Create default users if migration fails
        await initializeUsers();
      }
    } else {
      // Create default users
      await initializeUsers();
    }
  }
}

// Migrate JSON files to SQLite
async function migrateJsonToSqlite(db: Database.Database) {
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
  
  // Migrate users
  try {
    const usersData = await fs.readFile(USERS_FILE, 'utf-8');
    const users: User[] = JSON.parse(usersData);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, passwordHash, isAdmin, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((users: User[]) => {
      for (const user of users) {
        insertUser.run(
          user.username,
          user.passwordHash,
          user.isAdmin ? 1 : 0,
          Date.now()
        );
      }
    });

    insertMany(users);
    console.log(`Migrated ${users.length} users`);
  } catch (error) {
    // No users.json or error reading
  }

  // Migrate messages
  try {
    const messagesData = await fs.readFile(MESSAGES_FILE, 'utf-8');
    const messages: Message[] = JSON.parse(messagesData);
    
    const insertMessage = db.prepare(`
      INSERT INTO messages (id, username, message, timestamp, gifUrl, attachments, replyToId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((messages: Message[]) => {
      for (const message of messages) {
        insertMessage.run(
          message.id,
          message.username,
          message.message || null,
          message.timestamp,
          message.gifUrl || null,
          message.attachments ? JSON.stringify(message.attachments) : null,
          message.replyToId || null,
          message.timestamp
        );
      }
    });

    insertMany(messages);
    console.log(`Migrated ${messages.length} messages`);
  } catch (error) {
    // No messages.json or error reading
  }

  // Backup JSON files
  try {
    await fs.rename(USERS_FILE, `${USERS_FILE}.backup`);
    console.log('Backed up users.json to users.json.backup');
  } catch {
    // File doesn't exist or already moved
  }

  try {
    await fs.rename(MESSAGES_FILE, `${MESSAGES_FILE}.backup`);
    console.log('Backed up messages.json to messages.json.backup');
  } catch {
    // File doesn't exist or already moved
  }
}

// Initialize users if database is empty
export async function initializeUsers(): Promise<void> {
  await ensureDataDir();
  const db = getDb();
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    const bcrypt = await import('bcryptjs');
    const defaultUsers: Omit<User, 'isAdmin'>[] = [
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

    const insertUser = db.prepare(`
      INSERT INTO users (username, passwordHash, isAdmin, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((users: Omit<User, 'isAdmin'>[]) => {
      for (const user of users) {
        insertUser.run(user.username, user.passwordHash, 0, Date.now());
      }
    });

    insertMany(defaultUsers);
  }
}

// Read users from database
export async function readUsers(): Promise<User[]> {
  await initializeDatabase();
  const db = getDb();
  
  const rows = db.prepare('SELECT username, passwordHash, isAdmin FROM users').all() as Array<{
    username: string;
    passwordHash: string;
    isAdmin: number;
  }>;
  
  return rows.map(row => ({
    username: row.username,
    passwordHash: row.passwordHash,
    isAdmin: row.isAdmin === 1,
  }));
}

// Get single user
export async function getUser(username: string): Promise<User | null> {
  await initializeDatabase();
  const db = getDb();
  
  const row = db.prepare('SELECT username, passwordHash, isAdmin FROM users WHERE username = ?').get(username) as {
    username: string;
    passwordHash: string;
    isAdmin: number;
  } | undefined;
  
  if (!row) return null;
  
  return {
    username: row.username,
    passwordHash: row.passwordHash,
    isAdmin: row.isAdmin === 1,
  };
}

// Add new user
export async function addUser(username: string, passwordHash: string, isAdmin: boolean = false): Promise<void> {
  await initializeDatabase();
  const db = getDb();
  
  const insertUser = db.prepare(`
    INSERT INTO users (username, passwordHash, isAdmin, createdAt)
    VALUES (?, ?, ?, ?)
  `);
  
  try {
    insertUser.run(username, passwordHash, isAdmin ? 1 : 0, Date.now());
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username already exists');
    }
    throw error;
  }
}

// Update user
export async function updateUser(username: string, updates: { passwordHash?: string; isAdmin?: boolean }): Promise<void> {
  await initializeDatabase();
  const db = getDb();
  
  const updatesList: string[] = [];
  const values: any[] = [];
  
  if (updates.passwordHash !== undefined) {
    updatesList.push('passwordHash = ?');
    values.push(updates.passwordHash);
  }
  
  if (updates.isAdmin !== undefined) {
    updatesList.push('isAdmin = ?');
    values.push(updates.isAdmin ? 1 : 0);
  }
  
  if (updatesList.length === 0) {
    return; // No updates
  }
  
  values.push(username);
  
  const updateQuery = `UPDATE users SET ${updatesList.join(', ')} WHERE username = ?`;
  const stmt = db.prepare(updateQuery);
  stmt.run(...values);
}

// Delete user
export async function deleteUser(username: string): Promise<void> {
  await initializeDatabase();
  const db = getDb();
  
  const deleteStmt = db.prepare('DELETE FROM users WHERE username = ?');
  const result = deleteStmt.run(username);
  
  if (result.changes === 0) {
    throw new Error('User not found');
  }
}

// Read messages from database
export async function readMessages(): Promise<Message[]> {
  await initializeDatabase();
  const db = getDb();
  
  const rows = db.prepare('SELECT id, username, message, timestamp, gifUrl, attachments, replyToId FROM messages ORDER BY timestamp ASC').all() as Array<{
    id: string;
    username: string;
    message: string | null;
    timestamp: number;
    gifUrl: string | null;
    attachments: string | null;
    replyToId: string | null;
  }>;
  
  return rows.map(row => ({
    id: row.id,
    username: row.username,
    message: row.message || '',
    timestamp: row.timestamp,
    gifUrl: row.gifUrl || undefined,
    attachments: row.attachments ? JSON.parse(row.attachments) as Attachment[] : undefined,
    replyToId: row.replyToId || undefined,
  }));
}

// Get message by ID
export async function getMessageById(id: string): Promise<Message | null> {
  await initializeDatabase();
  const db = getDb();
  
  const row = db.prepare('SELECT id, username, message, timestamp, gifUrl, attachments, replyToId FROM messages WHERE id = ?').get(id) as {
    id: string;
    username: string;
    message: string | null;
    timestamp: number;
    gifUrl: string | null;
    attachments: string | null;
    replyToId: string | null;
  } | undefined;
  
  if (!row) return null;
  
  return {
    id: row.id,
    username: row.username,
    message: row.message || '',
    timestamp: row.timestamp,
    gifUrl: row.gifUrl || undefined,
    attachments: row.attachments ? JSON.parse(row.attachments) as Attachment[] : undefined,
    replyToId: row.replyToId || undefined,
  };
}

// Append message to database
export async function appendMessage(message: Message): Promise<void> {
  await initializeDatabase();
  const db = getDb();
  
  const insertMessage = db.prepare(`
    INSERT INTO messages (id, username, message, timestamp, gifUrl, attachments, replyToId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertMessage.run(
    message.id,
    message.username,
    message.message || null,
    message.timestamp,
    message.gifUrl || null,
    message.attachments ? JSON.stringify(message.attachments) : null,
    message.replyToId || null,
    message.timestamp
  );
}

// Delete message from database
export async function deleteMessage(messageId: string): Promise<boolean> {
  await initializeDatabase();
  const db = getDb();
  
  const deleteStmt = db.prepare('DELETE FROM messages WHERE id = ?');
  const result = deleteStmt.run(messageId);
  
  return result.changes > 0;
}

// Get uploads directory path
export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

// Get file path in uploads directory
export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}
