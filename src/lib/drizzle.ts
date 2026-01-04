import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db';

const client = new Database('./prisma/dev.db');
export const db = drizzle(client, { schema });
