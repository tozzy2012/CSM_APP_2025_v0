-- Migration: Restore status column to accounts table
-- This column is essential for the Kanban board functionality

-- Add status column back to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Saudável';

-- Update existing records to have a default status if they are null (though DEFAULT handles new ones)
UPDATE accounts SET status = 'Saudável' WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN accounts.status IS 'Current status of the account in the CS pipeline (e.g., Saudável, Atenção, Crítico)';
