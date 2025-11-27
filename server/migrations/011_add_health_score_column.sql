-- Migration: Add health_score column to accounts
-- This column is required for the dashboard average health score calculation

BEGIN;

-- 1. Add column
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 0;

-- 2. Update existing accounts with a default score based on status
-- Healthy -> 85, Attention -> 60, Critical -> 30
UPDATE accounts 
SET health_score = CASE 
    WHEN status = 'Saudável' THEN 85
    WHEN status = 'Atenção' THEN 60
    WHEN status = 'Crítico' THEN 30
    ELSE 75
END
WHERE health_score = 0 OR health_score IS NULL;

-- 3. Add comment
COMMENT ON COLUMN accounts.health_score IS 'Numerical health score (0-100)';

COMMIT;
