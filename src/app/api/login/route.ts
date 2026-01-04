import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPassword, signToken, cookieOptions, SessionUser } from '@/lib/auth';
import { AccessLevel } from '@/types/access';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email i lozinka su obavezni.' }, { status: 400 });
    }

    const [storedUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!storedUser || !storedUser.password) {
      return NextResponse.json({ error: 'Neispravni kredencijali.' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, storedUser.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Neispravni kredencijali.' }, { status: 401 });
    }

    const lastLogin = new Date();
    await db.update(users).set({ lastLogin }).where(eq(users.id, storedUser.id));

    const [freshUser] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      lastLogin: users.lastLogin,
    }).from(users).where(eq(users.id, storedUser.id)).limit(1);

    if (!freshUser) {
      return NextResponse.json({ error: 'Greška pri učitavanju korisnika.' }, { status: 500 });
    }

    const sessionUser: SessionUser = {
      id: freshUser.id,
      name: freshUser.name,
      email: freshUser.email,
      role: freshUser.role as AccessLevel,
    };

    const token = signToken(sessionUser);
    const responseUser = {
      id: freshUser.id,
      name: freshUser.name,
      email: freshUser.email,
      role: freshUser.role,
      lastLogin: freshUser.lastLogin,
    };

    const response = NextResponse.json({ user: responseUser });
    response.cookies.set({ ...cookieOptions, value: token });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Došlo je do greške pri prijavi.' }, { status: 500 });
  }
}
