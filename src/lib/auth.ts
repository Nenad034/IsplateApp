import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AccessLevel } from '@/types/access';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'isplate-secret';

if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn('Using default JWT secret. Set JWT_SECRET or NEXTAUTH_SECRET in production.');
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: AccessLevel;
}

export const authCookieName = 'isplate_token';

export const hashPassword = (value: string) => bcrypt.hash(value, 10);
export const verifyPassword = (value: string, hash: string) => bcrypt.compare(value, hash);

export const signToken = (user: SessionUser) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
};

export const verifyToken = (token: string): SessionUser | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
};

export type AuthSuccess = {
  user: SessionUser;
};

export type AuthFailure = {
  response: NextResponse;
};

export type AuthResult = AuthSuccess | AuthFailure;

export const requireAuth = (request: NextRequest, maxRole: AccessLevel = 3): AuthResult => {
  const token = request.cookies.get(authCookieName)?.value;
  if (!token) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = verifyToken(token);
  if (!user) {
    return { response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }

  if (user.role > maxRole) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user };
};

export const cookieOptions = {
  name: authCookieName,
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 8,
};
