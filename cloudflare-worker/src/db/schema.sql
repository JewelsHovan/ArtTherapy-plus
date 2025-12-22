-- ArtTherapy+ Database Schema
-- Cloudflare D1 (SQLite)
-- Created: 2025-10-20

-- Users table (core authentication + profile)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- UUID v4
  microsoft_id TEXT UNIQUE NOT NULL,      -- Microsoft OAuth user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT,                              -- From Microsoft profile
  avatar_url TEXT,                        -- Microsoft profile picture

  -- Profile fields (currently in Profile.jsx)
  age INTEGER,
  sex TEXT,
  gender TEXT,
  symptoms TEXT,                          -- JSON array
  location TEXT,
  languages TEXT,                         -- JSON array
  occupation TEXT,
  relationship_status TEXT,
  prescriptions TEXT,                     -- JSON array
  activity_level TEXT,

  -- Settings/preferences as JSON (lower priority)
  settings TEXT DEFAULT '{}',             -- JSON object for all settings

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gallery items (migrated from localStorage)
CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,                    -- UUID v4
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,                -- DALL-E generated image URL
  description TEXT NOT NULL,              -- User's pain description
  prompt_used TEXT,                       -- OpenAI's revised prompt
  mode TEXT,                              -- 'create' | 'inspire' | 'edit'

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Journal/reflection entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,                    -- UUID v4
  user_id TEXT NOT NULL,
  gallery_item_id TEXT,                   -- Optional link to artwork

  reflection_questions TEXT,              -- JSON array of questions
  responses TEXT,                         -- JSON array of user responses
  notes TEXT,                             -- Freeform notes

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (gallery_item_id) REFERENCES gallery_items(id) ON DELETE SET NULL
);

-- Rate limiting table (for brute force protection)
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,                    -- UUID v4
  ip TEXT NOT NULL,                       -- Client IP address
  endpoint TEXT NOT NULL,                 -- 'login' | 'signup'
  timestamp INTEGER NOT NULL              -- Unix timestamp in milliseconds
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gallery_user_created ON gallery_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(ip, endpoint, timestamp);
