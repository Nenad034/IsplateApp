import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core';

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  bankAccount: text('bank_account').notNull(),
  contactPerson: text('contact_person'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  country: text('country'),
  deleted: integer('deleted', { mode: 'boolean' }).default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  deletedBy: text('deleted_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const hotels = sqliteTable('hotels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  rooms: integer('rooms').notNull(),
  phone: text('phone').notNull(),
  manager: text('manager').notNull(),
  contactPerson: text('contact_person'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  deleted: integer('deleted', { mode: 'boolean' }).default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  deletedBy: text('deleted_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').notNull(),
  hotelId: text('hotel_id').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('USD'),
  date: text('date').notNull(),
  description: text('description').notNull(),
  status: text('status').default('pending'),
  dueDate: text('due_date'),
  method: text('method').notNull(),
  bankName: text('bank_name'),
  serviceType: text('service_type'),
  realizationYear: integer('realization_year'),
  reservations: text('reservations').default('[]'), // JSON array as string
  deleted: integer('deleted', { mode: 'boolean' }).default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  deletedBy: text('deleted_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: integer('role').default(3),
  lastLogin: integer('last_login', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  user: text('user').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
