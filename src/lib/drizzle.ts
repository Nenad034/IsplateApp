import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './db';

const sqlitePath = process.env.SQLITE_DB_PATH || './prisma/dev.db';
const client = new Database(sqlitePath);
export const db = drizzle(client, { schema });
