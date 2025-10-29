-- Migration: Add email/password authentication support
-- Date: 2025-10-22

-- Add password authentication columns
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email';

-- Update existing Microsoft OAuth users to have correct auth_provider
UPDATE users SET auth_provider = 'microsoft' WHERE microsoft_id IS NOT NULL;
