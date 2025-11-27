-- Migration: Remove unnecessary fields from clients table
-- Date: 2025-11-26
-- Description: Remove address, revenue, and founded_year columns from clients table

-- Remove address column (JSON field)
ALTER TABLE clients DROP COLUMN IF EXISTS address;

-- Remove revenue column (String field)
ALTER TABLE clients DROP COLUMN IF EXISTS revenue;

-- Remove founded_year column (Integer field)
ALTER TABLE clients DROP COLUMN IF EXISTS founded_year;
