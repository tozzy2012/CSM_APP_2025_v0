-- Migration: Fix organization_id on accounts, tasks, and activities
-- This script updates organization_id based on the associated client's organization_id

BEGIN;

-- 1. Update accounts to match their client's organization_id
UPDATE accounts a
SET organization_id = c.organization_id
FROM clients c
WHERE a.client_id = c.id
  AND a.organization_id != c.organization_id;

-- Show affected accounts
SELECT 'Updated Accounts:', COUNT(*) 
FROM accounts a
JOIN clients c ON a.client_id = c.id
WHERE a.organization_id = c.organization_id;

-- 2. Update tasks to match their account's organization_id (if account_id exists)
UPDATE tasks t
SET organization_id = a.organization_id
FROM accounts a
WHERE t.account_id = a.id
  AND t.organization_id != a.organization_id;

-- Show affected tasks
SELECT 'Updated Tasks:', COUNT(*) 
FROM tasks t
JOIN accounts a ON t.account_id = a.id
WHERE t.organization_id = a.organization_id;

-- 3. Update activities to match their account's organization_id
UPDATE activities act
SET organization_id = a.organization_id
FROM accounts a
WHERE act.account_id = a.id
  AND act.organization_id != a.organization_id;

-- Show affected activities
SELECT 'Updated Activities:', COUNT(*) 
FROM activities act
JOIN accounts a ON act.account_id = a.id
WHERE act.organization_id = a.organization_id;

COMMIT;

-- Final verification
SELECT 'VERIFICATION - Accounts by Organization:' as info;
SELECT organization_id, COUNT(*) as count 
FROM accounts 
GROUP BY organization_id;

SELECT 'VERIFICATION - Tasks by Organization:' as info;
SELECT organization_id, COUNT(*) as count 
FROM tasks 
GROUP BY organization_id;

SELECT 'VERIFICATION - Activities by Organization:' as info;
SELECT organization_id, COUNT(*) as count 
FROM activities 
GROUP BY organization_id;
