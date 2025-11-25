-- Check current state of accounts, tasks, and activities
SELECT 'ACCOUNTS' as table_name, id, name, organization_id, client_id 
FROM accounts 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'CLIENTS' as table_name, id, name, organization_id 
FROM clients 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'TASKS' as table_name, id, title, organization_id, account_id 
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'ACTIVITIES' as table_name, id, title, organization_id, account_id 
FROM activities 
ORDER BY created_at DESC 
LIMIT 10;
