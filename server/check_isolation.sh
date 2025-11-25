#!/bin/bash
# Diagnostic script to check organization isolation
echo "=== DIAGNOSTIC: Checking Organization Isolation ==="
echo ""

# Check if migration was applied
echo "1. Checking if accounts have correct organization_id..."
PGPASSWORD=zapper_password psql -U zapper_user -d zapper_cs -h localhost << EOF
-- Show counts by organization
SELECT 'Clients by Organization:' as info;
SELECT organization_id, COUNT(*) as count 
FROM clients 
GROUP BY organization_id
ORDER BY organization_id;

SELECT 'Accounts by Organization:' as info;
SELECT organization_id, COUNT(*) as count 
FROM accounts 
GROUP BY organization_id
ORDER BY organization_id;

-- Show mismatched accounts (where account.organization_id != client.organization_id)
SELECT 'PROBLEM: Accounts with wrong organization_id:' as info;
SELECT a.id, a.name, a.organization_id as account_org, c.organization_id as client_org
FROM accounts a
JOIN clients c ON a.client_id = c.id
WHERE a.organization_id != c.organization_id
LIMIT 10;
EOF

echo ""
echo "2. If you see mismatched accounts above, run the migration:"
echo "   cd /home/ricardolange/zapper-cs/CSM_APP_2025_v0/server"
echo "   PGPASSWORD=zapper_password psql -U zapper_user -d zapper_cs -h localhost -f migrations/002_fix_organization_ids.sql"
