-- This file contains SQL commands for the current update only
-- Copy and paste the contents into Supabase SQL editor to apply changes
-- This file will be wiped and replaced with each new update

-- =============================================
-- UPDATE: Fix Nominations RLS and Make Description Optional
-- =============================================
-- Allow all authenticated users to insert nominations
-- Make description optional

-- Drop the foreign key constraint on nominee_id (if it exists)
ALTER TABLE nominations DROP CONSTRAINT IF EXISTS nominations_nominee_id_fkey;

-- Change nominee_id to TEXT to store employee names
ALTER TABLE nominations ALTER COLUMN nominee_id TYPE TEXT;

-- Make description optional (allow NULL)
ALTER TABLE nominations ALTER COLUMN description DROP NOT NULL;

-- Add job_title column to employees (if not already added)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Users can create nominations for their club" ON nominations;
DROP POLICY IF EXISTS "Users can create nominations" ON nominations;

-- Allow all authenticated users to insert nominations (simplified)
CREATE POLICY "Users can create nominations" ON nominations
  FOR INSERT WITH CHECK (true);
