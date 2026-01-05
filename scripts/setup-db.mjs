import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please add DATABASE_URL to your .env file');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

console.log('🔄 Initializing PostgreSQL database...');

const hashedAdminPassword = bcrypt.hashSync('admin123', 10);

try {
  // Drop existing tables (be careful in production!)
  await sql`DROP TABLE IF EXISTS activity_logs CASCADE`;
  await sql`DROP TABLE IF EXISTS payments CASCADE`;
  await sql`DROP TABLE IF EXISTS hotels CASCADE`;
  await sql`DROP TABLE IF EXISTS suppliers CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  // Create suppliers table
  await sql`
    CREATE TABLE suppliers (
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      bank_account TEXT NOT NULL,
      contact_person TEXT,
      latitude NUMERIC,
      longitude NUMERIC,
      country TEXT,
      deleted BOOLEAN DEFAULT false,
      deleted_at TIMESTAMP,
      deleted_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create hotels table
  await sql`
    CREATE TABLE hotels (
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      rooms INTEGER NOT NULL,
      phone TEXT NOT NULL,
      manager TEXT NOT NULL,
      supplier_id VARCHAR(255),
      contact_person TEXT,
      latitude NUMERIC,
      longitude NUMERIC,
      deleted BOOLEAN DEFAULT false,
      deleted_at TIMESTAMP,
      deleted_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create payments table
  await sql`
    CREATE TABLE payments (
      id VARCHAR(255) PRIMARY KEY,
      supplier_id VARCHAR(255) NOT NULL,
      hotel_id VARCHAR(255) NOT NULL,
      amount NUMERIC NOT NULL,
      currency TEXT DEFAULT 'EUR',
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      document_type TEXT,
      document_number TEXT,
      method TEXT NOT NULL,
      bank_name TEXT,
      service_type TEXT,
      realization_year INTEGER,
      reservations TEXT DEFAULT '[]',
      deleted BOOLEAN DEFAULT false,
      deleted_at TIMESTAMP,
      deleted_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create users table
  await sql`
    CREATE TABLE users (
      id VARCHAR(255) PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      role INTEGER DEFAULT 3,
      last_login TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create activity_logs table
  await sql`
    CREATE TABLE activity_logs (
      id VARCHAR(255) PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      "user" TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT NOW()
    )
  `;

  // Insert admin user
  await sql`
    INSERT INTO users (id, name, email, password, role)
    VALUES ('1', 'Admin Korisnik', 'admin@isplate.rs', ${hashedAdminPassword}, 1)
    ON CONFLICT (email) DO NOTHING
  `;

  console.log('✅ Database tables created successfully');
  console.log('✅ Admin user created: admin@isplate.rs / admin123');
  
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

