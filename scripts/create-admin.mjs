import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const email = 'nenad.tomic@olympic.rs';
const password = 'milica1403#';
const name = 'Nenad Tomic';
const role = 1; // Admin

console.log('🔄 Creating admin user...');

const hashedPassword = bcrypt.hashSync(password, 10);
const userId = `user-${Date.now()}`;

try {
  // Check if user already exists
  const existingUser = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;

  if (existingUser.length > 0) {
    console.log('⚠️  User already exists. Updating password and role...');
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}, role = ${role}, name = ${name}
      WHERE email = ${email}
    `;
    console.log('✅ User updated successfully');
  } else {
    await sql`
      INSERT INTO users (id, name, email, password, role)
      VALUES (${userId}, ${name}, ${email}, ${hashedPassword}, ${role})
    `;
    console.log('✅ Admin user created successfully');
  }

  console.log('');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('👤 Role: Admin (1)');
  
} catch (error) {
  console.error('❌ Error creating user:', error);
  process.exit(1);
}
