-- Migration: Add internal kickoff and remove unnecessary account fields
-- This migration removes fields that aren't needed at account creation
-- and adds a comprehensive internal_kickoff JSON field for sales-to-CS handoff

-- Remove unnecessary columns from accounts table
ALTER TABLE accounts DROP COLUMN IF EXISTS stage;
ALTER TABLE accounts DROP COLUMN IF EXISTS contract_value;
ALTER TABLE accounts DROP COLUMN IF EXISTS employees;
ALTER TABLE accounts DROP COLUMN IF EXISTS health_score;
ALTER TABLE accounts DROP COLUMN IF EXISTS status;

-- Add internal_kickoff JSON column for comprehensive handoff data
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS internal_kickoff JSON DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN accounts.internal_kickoff IS 'Sales to CS handoff information using SPICED framework and CS best practices';
