import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tempchat.db');

let dbInstance: Database.Database | null = null;

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Get or create database instance
export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure data directory exists (sync version for better-sqlite3)
  try {
    require('fs').mkdirSync(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }

  dbInstance = new Database(DB_FILE);
  
  // Enable foreign keys
  dbInstance.pragma('foreign_keys = ON');
  
  // Initialize schema
  initializeSchema(dbInstance);
  
  return dbInstance;
}

// Initialize database schema
function initializeSchema(db: Database.Database) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      isAdmin INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      message TEXT,
      timestamp INTEGER NOT NULL,
      gifUrl TEXT,
      attachments TEXT,
      replyToId TEXT,
      createdAt INTEGER NOT NULL
    )
  `);

  // Migrate existing messages table to add replyToId column if it doesn't exist
  try {
    // Check if column exists by trying to select it
    db.prepare('SELECT replyToId FROM messages LIMIT 1').get();
  } catch {
    // Column doesn't exist, add it
    try {
      db.exec(`ALTER TABLE messages ADD COLUMN replyToId TEXT`);
    } catch (error: any) {
      // Ignore errors (column might have been added by another process)
      console.warn('Migration note: Could not add replyToId column:', error.message);
    }
  }

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);
    CREATE INDEX IF NOT EXISTS idx_messages_replyToId ON messages(replyToId);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);
}

// Close database connection (useful for cleanup)
export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

