-- Migration: Add SSO fields to users table
-- Date: 2025-11-24
-- Description: Add support for WorkOS SSO authentication

BEGIN;

-- Add SSO fields to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS sso_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sso_user_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Make password_hash nullable for SSO users
ALTER TABLE users 
    ALTER COLUMN password_hash DROP NOT NULL;

-- Create index on sso_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_sso_user_id ON users(sso_user_id);

-- Create index on sso_provider for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users(sso_provider);

COMMIT;
