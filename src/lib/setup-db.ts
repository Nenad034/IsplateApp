import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('Initializing database at:', dbPath);

db.exec(`
  DROP TABLE IF EXISTS activity_logs;
  
  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    country TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    rooms INTEGER NOT NULL,
    phone TEXT NOT NULL,
    manager TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    hotel_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    method TEXT NOT NULL,
    bank_name TEXT,
    service_type TEXT,
    realization_year INTEGER,
    reservations TEXT DEFAULT '[]',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    role INTEGER DEFAULT 3,
    last_login INTEGER DEFAULT (strftime('%s', 'now')),
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    user TEXT NOT NULL,
    timestamp INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Insert default admin if not exists
  INSERT OR IGNORE INTO users (id, name, email, password, role) 
  VALUES ('1', 'Admin Korisnik', 'admin@isplate.rs', 'admin123', 1);
`);

console.log('Database tables created successfully.');
db.close();
