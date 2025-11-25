-- Clean all operational data (keep users and organizations)
BEGIN;

-- Delete in correct order due to foreign keys
DELETE FROM activities;
DELETE FROM tasks;
DELETE FROM accounts;
DELETE FROM clients;

-- Verify
SELECT 'Activities deleted:' as info, COUNT(*) as count FROM activities;
SELECT 'Tasks deleted:' as info, COUNT(*) as count FROM tasks;
SELECT 'Accounts deleted:' as info, COUNT(*) as count FROM accounts;
SELECT 'Clients deleted:' as info, COUNT(*) as count FROM clients;

SELECT 'Users remain:' as info, COUNT(*) as count FROM users;
SELECT 'Organizations remain (as users):' as info, COUNT(DISTINCT organization_id) as count FROM users WHERE organization_id IS NOT NULL;

COMMIT;

-- Show remaining data
SELECT 'Remaining Users:' as info;
SELECT id, email, name, role, organization_id FROM users ORDER BY created_at;
