-- This file contains SQL commands for the current update only
-- Copy and paste the contents into Supabase SQL editor to apply changes
-- This file will be wiped and replaced with each new update

-- =============================================
-- UPDATE: Fix Nominations Table for Employee Names
-- =============================================
-- Change nominee_id from UUID (profile reference) to TEXT (employee name)
-- since nominees come from the employees table, not profiles

-- Drop the foreign key constraint
ALTER TABLE nominations DROP CONSTRAINT IF EXISTS nominations_nominee_id_fkey;

-- Change nominee_id to TEXT to store employee names
ALTER TABLE nominations ALTER COLUMN nominee_id TYPE TEXT;

-- Add job_title column to employees (if not already added)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title TEXT;
