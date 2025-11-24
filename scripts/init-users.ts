import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

async function initializeUsers() {
  // Ensure data directory exists
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Create default users with hashed passwords
  const defaultUsers = [
    {
      username: 'user1',
      passwordHash: bcrypt.hashSync('user1pass', 10),
    },
    {
      username: 'user2',
      passwordHash: bcrypt.hashSync('user2pass', 10),
    },
    {
      username: 'user3',
      passwordHash: bcrypt.hashSync('user3pass', 10),
    },
    {
      username: 'alex',
      passwordHash: bcrypt.hashSync('user1pass', 10),
    },
  ];

  await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  console.log('Users initialized successfully!');
  console.log('Default users:');
  console.log('  user1 / user1pass');
  console.log('  user2 / user2pass');
  console.log('  user3 / user3pass');
  console.log('  alex / user1pass');
}

initializeUsers().catch(console.error);

