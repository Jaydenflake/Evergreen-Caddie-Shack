-- This file contains SQL commands for the current update only
-- Copy and paste the contents into Supabase SQL editor to apply changes
-- This file will be wiped and replaced with each new update

-- =============================================
-- UPDATE: Fix RLS policy for profiles table
-- =============================================
-- Allow all authenticated users to read profiles (needed for custom auth)

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view profiles from their club or all if Service Center" ON profiles;

-- Create a new policy that allows all authenticated reads
CREATE POLICY "Allow all authenticated users to read profiles" ON profiles
  FOR SELECT USING (true);
