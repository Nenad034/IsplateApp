import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, 3);
  if ('response' in auth) {
    return auth.response;
  }

  const [freshUser] = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    lastLogin: users.lastLogin,
  }).from(users).where(eq(users.id, auth.user.id)).limit(1);

  if (!freshUser) {
    return NextResponse.json({ error: 'Korisnik nije pronađen.' }, { status: 404 });
  }

  return NextResponse.json({ user: freshUser });
}
