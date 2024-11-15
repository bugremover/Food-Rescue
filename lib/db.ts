import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'food-rescue.db'), { verbose: console.log });

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'VOLUNTEER',
    businessId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    quantity TEXT NOT NULL,
    expiry DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    businessId TEXT NOT NULL,
    donorId TEXT NOT NULL,
    claimerId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (businessId) REFERENCES businesses(id),
    FOREIGN KEY (donorId) REFERENCES users(id),
    FOREIGN KEY (claimerId) REFERENCES users(id)
  );
`);

export { db };