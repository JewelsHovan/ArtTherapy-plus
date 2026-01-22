/**
 * Database schema for ArtTherapy+ using Drizzle ORM with Azure SQL
 *
 * Migrated from Cloudflare D1 (SQLite) schema.
 * Tables: users, gallery_items, journal_entries, rate_limits
 */

import {
  varchar,
  text,
  int,
  datetime,
  index,
  uniqueIndex,
} from 'drizzle-orm/mssql-core';
import { mssqlTable } from 'drizzle-orm/mssql-core';

/**
 * Users table - Core authentication and profile data
 *
 * Supports both Microsoft OAuth and email/password authentication.
 * Profile fields store user demographics and settings.
 */
export const users = mssqlTable(
  'users',
  {
    id: varchar('id', { length: 36 }).primaryKey(), // UUID v4
    microsoftId: varchar('microsoft_id', { length: 255 }).unique(), // Microsoft OAuth user ID (NULL for email auth)
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    avatarUrl: text('avatar_url'), // Profile picture URL

    // Email/password authentication fields
    passwordHash: varchar('password_hash', { length: 64 }), // Hex-encoded PBKDF2 hash (NULL for OAuth users)
    passwordSalt: varchar('password_salt', { length: 32 }), // Hex-encoded salt (NULL for OAuth users)
    authProvider: varchar('auth_provider', { length: 20 }).default('email'), // 'email' | 'microsoft'

    // Profile fields
    age: int('age'),
    sex: varchar('sex', { length: 20 }),
    gender: varchar('gender', { length: 50 }),
    symptoms: text('symptoms'), // JSON array
    location: varchar('location', { length: 255 }),
    languages: text('languages'), // JSON array
    occupation: varchar('occupation', { length: 255 }),
    relationshipStatus: varchar('relationship_status', { length: 50 }),
    prescriptions: text('prescriptions'), // JSON array
    activityLevel: varchar('activity_level', { length: 50 }),

    // Settings/preferences as JSON
    settings: text('settings').default('{}'), // JSON object for all settings

    // Metadata
    createdAt: datetime('created_at').default(new Date()),
    updatedAt: datetime('updated_at').default(new Date()),
  },
  (table) => [
    uniqueIndex('idx_users_microsoft_id').on(table.microsoftId),
    uniqueIndex('idx_users_email').on(table.email),
  ]
);

/**
 * Gallery items table - Stores generated artwork
 *
 * Links to users and stores image URLs, descriptions, and generation metadata.
 */
export const galleryItems = mssqlTable(
  'gallery_items',
  {
    id: varchar('id', { length: 36 }).primaryKey(), // UUID v4
    userId: varchar('user_id', { length: 36 }).notNull(), // FK to users.id
    imageUrl: text('image_url').notNull(), // Stored image URL (Azure Blob Storage)
    description: text('description').notNull(), // User's pain description
    promptUsed: text('prompt_used'), // OpenAI's revised prompt
    mode: varchar('mode', { length: 20 }), // 'create' | 'inspire' | 'edit'

    createdAt: datetime('created_at').default(new Date()),
  },
  (table) => [
    index('idx_gallery_user_created').on(table.userId, table.createdAt),
  ]
);

/**
 * Journal entries table - Reflection and notes
 *
 * Stores reflection questions, user responses, and freeform notes.
 * Optionally linked to a gallery item.
 */
export const journalEntries = mssqlTable(
  'journal_entries',
  {
    id: varchar('id', { length: 36 }).primaryKey(), // UUID v4
    userId: varchar('user_id', { length: 36 }).notNull(), // FK to users.id
    galleryItemId: varchar('gallery_item_id', { length: 36 }), // Optional FK to gallery_items.id

    reflectionQuestions: text('reflection_questions'), // JSON array of questions
    responses: text('responses'), // JSON array of user responses
    notes: text('notes'), // Freeform notes

    createdAt: datetime('created_at').default(new Date()),
    updatedAt: datetime('updated_at').default(new Date()),
  },
  (table) => [
    index('idx_journal_user_created').on(table.userId, table.createdAt),
  ]
);

/**
 * Rate limits table - Brute force protection
 *
 * Tracks request attempts per IP/endpoint for rate limiting.
 */
export const rateLimits = mssqlTable(
  'rate_limits',
  {
    id: varchar('id', { length: 36 }).primaryKey(), // UUID v4
    ip: varchar('ip', { length: 45 }).notNull(), // IPv4 or IPv6 address
    endpoint: varchar('endpoint', { length: 50 }).notNull(), // 'login' | 'signup'
    timestamp: datetime('timestamp').notNull(), // Request timestamp
  },
  (table) => [
    index('idx_rate_limits_lookup').on(table.ip, table.endpoint, table.timestamp),
  ]
);

// Type exports for use in handlers
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type NewGalleryItem = typeof galleryItems.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
