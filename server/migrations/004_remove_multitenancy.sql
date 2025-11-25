-- Migration: Remove Multi-Tenancy (organization_id)
-- This migration removes organization_id from all tables to convert to single-tenant

BEGIN;

-- 1. Drop organization_id columns from operational tables
ALTER TABLE clients DROP COLUMN IF EXISTS organization_id;
ALTER TABLE accounts DROP COLUMN IF EXISTS organization_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS organization_id;
ALTER TABLE activities DROP COLUMN IF EXISTS organization_id;
ALTER TABLE playbooks DROP COLUMN IF EXISTS organization_id;

-- 2. Simplify users table
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- 3. Drop organizations/tenants table if exists
DROP TABLE IF EXISTS tenants CASCADE;

-- Verify changes
SELECT 'VERIFICATION:' as info;

SELECT 'Clients columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

SELECT 'Accounts columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
ORDER BY ordinal_position;

SELECT 'Users columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

COMMIT;
