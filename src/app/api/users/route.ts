import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashPassword, requireAuth } from '@/lib/auth';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const dbSqlite = new Database('./prisma/dev.db');
const email = 'nenad.tomic@olympic.rs';
const newPassword = 'milica1403#';

const hash = bcrypt.hashSync(newPassword, 10);
const stmt = dbSqlite.prepare('UPDATE users SET password = ? WHERE email = ?');
const info = stmt.run(hash, email);

console.log(`Updated ${info.changes} user(s).`);
dbSqlite.close();

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, 1);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const data = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
    }).from(users);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, 1);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    if (!body.password) {
      return NextResponse.json({ error: 'Lozinka je obavezna.' }, { status: 400 });
    }

    const hashed = await hashPassword(body.password);
    await db.insert(users).values({
      id: body.id,
      name: body.name,
      email: body.email,
      password: hashed,
      role: body.role || 3,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, 1);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {
      name: body.name,
      email: body.email,
      role: body.role,
    };

    if (body.password) {
      updates.password = await hashPassword(body.password);
    }

    await db.update(users).set(updates).where(eq(users.id, body.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request, 1);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
