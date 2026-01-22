-- ArtTherapy+ Database Schema for Azure SQL
-- Migration: 001_init_schema
-- Created from Cloudflare D1 schema
--
-- Run with: sqlcmd -S server.database.windows.net -d arttherapy-plus -U admin -P password -i 001_init_schema.sql

-- Users table (core authentication + profile)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id NVARCHAR(36) PRIMARY KEY,                      -- UUID v4
        microsoft_id NVARCHAR(255) UNIQUE,                -- Microsoft OAuth user ID (NULL for email auth)
        email NVARCHAR(255) NOT NULL UNIQUE,
        name NVARCHAR(255),                               -- From Microsoft profile or signup
        avatar_url NVARCHAR(MAX),                         -- Profile picture URL

        -- Email/password authentication fields
        password_hash NVARCHAR(64),                       -- Hex-encoded PBKDF2 hash (NULL for OAuth users)
        password_salt NVARCHAR(32),                       -- Hex-encoded salt (NULL for OAuth users)
        auth_provider NVARCHAR(20) DEFAULT 'email',       -- 'email' | 'microsoft'

        -- Profile fields
        age INT,
        sex NVARCHAR(20),
        gender NVARCHAR(50),
        symptoms NVARCHAR(MAX),                           -- JSON array
        location NVARCHAR(255),
        languages NVARCHAR(MAX),                          -- JSON array
        occupation NVARCHAR(255),
        relationship_status NVARCHAR(50),
        prescriptions NVARCHAR(MAX),                      -- JSON array
        activity_level NVARCHAR(50),

        -- Settings/preferences as JSON
        settings NVARCHAR(MAX) DEFAULT '{}',              -- JSON object for all settings

        -- Metadata
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END;

-- Gallery items (migrated from localStorage)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='gallery_items' AND xtype='U')
BEGIN
    CREATE TABLE gallery_items (
        id NVARCHAR(36) PRIMARY KEY,                      -- UUID v4
        user_id NVARCHAR(36) NOT NULL,
        image_url NVARCHAR(MAX) NOT NULL,                 -- Stored image URL (Azure Blob Storage)
        description NVARCHAR(MAX) NOT NULL,               -- User's pain description
        prompt_used NVARCHAR(MAX),                        -- OpenAI's revised prompt
        mode NVARCHAR(20),                                -- 'create' | 'inspire' | 'edit'

        created_at DATETIME2 DEFAULT GETDATE(),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END;

-- Journal/reflection entries
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='journal_entries' AND xtype='U')
BEGIN
    CREATE TABLE journal_entries (
        id NVARCHAR(36) PRIMARY KEY,                      -- UUID v4
        user_id NVARCHAR(36) NOT NULL,
        gallery_item_id NVARCHAR(36),                     -- Optional link to artwork

        reflection_questions NVARCHAR(MAX),               -- JSON array of questions
        responses NVARCHAR(MAX),                          -- JSON array of user responses
        notes NVARCHAR(MAX),                              -- Freeform notes

        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (gallery_item_id) REFERENCES gallery_items(id) ON DELETE NO ACTION
    );
END;

-- Rate limiting table (for brute force protection)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='rate_limits' AND xtype='U')
BEGIN
    CREATE TABLE rate_limits (
        id NVARCHAR(36) PRIMARY KEY,                      -- UUID v4
        ip NVARCHAR(45) NOT NULL,                         -- IPv4 or IPv6 address
        endpoint NVARCHAR(50) NOT NULL,                   -- 'login' | 'signup'
        timestamp DATETIME2 NOT NULL                      -- Request timestamp
    );
END;

-- Indexes for common queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_gallery_user_created')
BEGIN
    CREATE INDEX idx_gallery_user_created ON gallery_items(user_id, created_at DESC);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_journal_user_created')
BEGIN
    CREATE INDEX idx_journal_user_created ON journal_entries(user_id, created_at DESC);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_users_microsoft_id')
BEGIN
    CREATE INDEX idx_users_microsoft_id ON users(microsoft_id);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_users_email')
BEGIN
    CREATE INDEX idx_users_email ON users(email);
END;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_rate_limits_lookup')
BEGIN
    CREATE INDEX idx_rate_limits_lookup ON rate_limits(ip, endpoint, timestamp);
END;

PRINT 'Schema migration 001_init_schema completed successfully';
