-- Migration: Add users table and organization_id to playbooks
-- Description: Implements multi-tenant architecture with role-based access control
-- Date: 2025-11-23

-- ============================================================================
-- Create users table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ORG_ADMIN', 'CSM')),
    organization_id VARCHAR(255),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- Add organization_id to playbooks (NULL = global playbook)
-- ============================================================================

ALTER TABLE playbooks 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Create index on organization_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_playbooks_organization_id ON playbooks(organization_id);

-- ============================================================================
-- Seed initial data
-- ============================================================================

-- Insert Super Admin (password: adminadmin)
-- Using bcrypt hash with cost factor 12
INSERT INTO users (id, email, password_hash, name, role, organization_id, active)
VALUES (
    'super-admin-001',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIujbCXQpO',  -- adminadmin
    'Super Admin',
    'SUPER_ADMIN',
    NULL,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Note: Existing playbooks will have NULL organization_id (global playbooks)
-- Organizations and their admins will be created via the API

COMMENT ON TABLE users IS 'User accounts with role-based access control for multi-tenant SaaS';
COMMENT ON COLUMN users.role IS 'User role: SUPER_ADMIN (manages orgs), ORG_ADMIN (manages CSMs), CSM (no user management)';
COMMENT ON COLUMN users.organization_id IS 'Organization FK, NULL for SUPER_ADMIN';
COMMENT ON COLUMN playbooks.organization_id IS 'Organization FK, NULL for global/shared playbooks';
