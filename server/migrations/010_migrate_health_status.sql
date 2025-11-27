-- Migration: Migrate health_status to status
-- This ensures existing accounts appear in the correct Kanban columns

-- Update status based on health_status
UPDATE accounts 
SET status = CASE 
    WHEN health_status = 'healthy' THEN 'Saudável'
    WHEN health_status = 'at-risk' THEN 'Atenção'
    WHEN health_status = 'critical' THEN 'Crítico'
    ELSE status -- Keep existing status if no match (likely 'Saudável' from default)
END
WHERE health_status IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN accounts.status IS 'Current status of the account in the CS pipeline, migrated from health_status where applicable';
