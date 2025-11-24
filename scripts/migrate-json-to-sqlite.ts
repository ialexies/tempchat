import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import { User, Message } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tempchat.db');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

async function migrate() {
  try {
    // Check if database already exists
    try {
      await fs.access(DB_FILE);
      console.log('Database already exists. Migration not needed.');
      return;
    } catch {
      // Database doesn't exist, proceed with migration
    }

    // Check if JSON files exist
    let usersJsonExists = false;
    let messagesJsonExists = false;

    try {
      await fs.access(USERS_FILE);
      usersJsonExists = true;
    } catch {
      console.log('users.json not found, skipping user migration');
    }

    try {
      await fs.access(MESSAGES_FILE);
      messagesJsonExists = true;
    } catch {
      console.log('messages.json not found, skipping message migration');
    }

    if (!usersJsonExists && !messagesJsonExists) {
      console.log('No JSON files to migrate. Creating empty database.');
      // Create empty database
      const db = new Database(DB_FILE);
      db.pragma('foreign_keys = ON');
      
      // Initialize schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          isAdmin INTEGER DEFAULT 0,
          createdAt INTEGER NOT NULL
        )
      `);

      db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          message TEXT,
          timestamp INTEGER NOT NULL,
          gifUrl TEXT,
          attachments TEXT,
          createdAt INTEGER NOT NULL
        )
      `);

      db.close();
      return;
    }

    // Create database
    const db = new Database(DB_FILE);
    db.pragma('foreign_keys = ON');

    // Initialize schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        isAdmin INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        message TEXT,
        timestamp INTEGER NOT NULL,
        gifUrl TEXT,
        attachments TEXT,
        createdAt INTEGER NOT NULL
      )
    `);

    // Migrate users
    if (usersJsonExists) {
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
    }

    // Migrate messages
    if (messagesJsonExists) {
      const messagesData = await fs.readFile(MESSAGES_FILE, 'utf-8');
      const messages: Message[] = JSON.parse(messagesData);
      
      const insertMessage = db.prepare(`
        INSERT INTO messages (id, username, message, timestamp, gifUrl, attachments, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
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
            message.timestamp
          );
        }
      });

      insertMany(messages);
      console.log(`Migrated ${messages.length} messages`);
    }

    db.close();

    // Backup JSON files
    if (usersJsonExists) {
      await fs.rename(USERS_FILE, `${USERS_FILE}.backup`);
      console.log('Backed up users.json to users.json.backup');
    }

    if (messagesJsonExists) {
      await fs.rename(MESSAGES_FILE, `${MESSAGES_FILE}.backup`);
      console.log('Backed up messages.json to messages.json.backup');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

