import { sql } from 'drizzle-orm';
import { text, varchar, integer, numeric, boolean, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  bankAccount: text('bank_account').notNull(),
  contactPerson: text('contact_person'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  country: text('country'),
  deleted: boolean('deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const hotels = pgTable('hotels', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  rooms: integer('rooms').notNull(),
  phone: text('phone').notNull(),
  manager: text('manager').notNull(),
  supplierId: varchar('supplier_id', { length: 255 }),
  contactPerson: text('contact_person'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  deleted: boolean('deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  supplierId: varchar('supplier_id', { length: 255 }).notNull(),
  hotelId: varchar('hotel_id', { length: 255 }).notNull(),
  amount: numeric('amount').notNull(),
  currency: text('currency').default('EUR'),
  date: text('date').notNull(),
  description: text('description').notNull(),
  status: text('status').default('pending'),
  dueDate: text('due_date'),
  documentType: text('document_type'),
  documentNumber: text('document_number'),
  method: text('method').notNull(),
  bankName: text('bank_name'),
  serviceType: text('service_type'),
  realizationYear: integer('realization_year'),
  reservations: text('reservations').default('[]'), // JSON array as string
  deleted: boolean('deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: integer('role').default(3),
  lastLogin: timestamp('last_login').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  user: text('user').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});
