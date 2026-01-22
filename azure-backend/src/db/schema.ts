/**
 * Database schema types for ArtTherapy+ with Azure SQL
 *
 * Plain TypeScript interfaces for type safety.
 * The actual database operations use raw SQL queries via tedious.
 */

/**
 * Users table - Core authentication and profile data
 */
export interface User {
  id: string; // UUID v4
  microsoft_id: string | null;
  email: string;
  name: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  password_salt: string | null;
  auth_provider: 'email' | 'microsoft';
  age: number | null;
  sex: string | null;
  gender: string | null;
  symptoms: string | null; // JSON array
  location: string | null;
  languages: string | null; // JSON array
  occupation: string | null;
  relationship_status: string | null;
  prescriptions: string | null; // JSON array
  activity_level: string | null;
  settings: string; // JSON object
  created_at: Date;
  updated_at: Date;
}

export type NewUser = Omit<User, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

/**
 * Gallery items table - Stores generated artwork
 */
export interface GalleryItem {
  id: string; // UUID v4
  user_id: string;
  image_url: string;
  description: string;
  prompt_used: string | null;
  mode: 'create' | 'inspire' | 'edit' | null;
  created_at: Date;
}

export type NewGalleryItem = Omit<GalleryItem, 'created_at'> & {
  created_at?: Date;
};

/**
 * Journal entries table - Reflection and notes
 */
export interface JournalEntry {
  id: string; // UUID v4
  user_id: string;
  gallery_item_id: string | null;
  reflection_questions: string | null; // JSON array
  responses: string | null; // JSON array
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type NewJournalEntry = Omit<JournalEntry, 'created_at' | 'updated_at'> & {
  created_at?: Date;
  updated_at?: Date;
};

/**
 * Rate limits table - Brute force protection
 */
export interface RateLimit {
  id: string; // UUID v4
  ip: string;
  endpoint: string;
  timestamp: Date;
}

export type NewRateLimit = RateLimit;
