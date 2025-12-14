-- This file contains SQL commands for the current update only
-- Copy and paste the contents into Supabase SQL editor to apply changes
-- This file will be wiped and replaced with each new update

-- =============================================
-- UPDATE: Add Custom Username/Password Authentication
-- =============================================
-- This update adds custom authentication without requiring email
-- Users sign up with username/password instead

-- Step 1: Add username and password_hash to profiles
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN password_hash TEXT;

-- Step 2: Make email optional (not all users have email)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- Step 3: Add unique constraint on username
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Step 4: Make username required for new signups (we'll handle this in app logic)
-- Note: Existing profiles won't have username, they'll need to be migrated

-- Step 5: Update sample data to have usernames
UPDATE profiles SET username = 'jsmith', password_hash = '$2a$10$example_hash_here' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE profiles SET username = 'sjohnson', password_hash = '$2a$10$example_hash_here' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE profiles SET username = 'mwilliams', password_hash = '$2a$10$example_hash_here' WHERE id = '00000000-0000-0000-0000-000000000003';
UPDATE profiles SET username = 'edavis', password_hash = '$2a$10$example_hash_here' WHERE id = '00000000-0000-0000-0000-000000000004';
UPDATE profiles SET username = 'dmartinez', password_hash = '$2a$10$example_hash_here' WHERE id = '00000000-0000-0000-0000-000000000005';

-- Step 6: Create function to register new user
CREATE OR REPLACE FUNCTION register_user(
  p_username TEXT,
  p_password_hash TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_club_id UUID,
  p_department_id UUID,
  p_role TEXT DEFAULT 'Team Member'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_full_name TEXT;
BEGIN
  -- Combine first and last name
  v_full_name := p_first_name || ' ' || p_last_name;

  -- Insert new profile
  INSERT INTO profiles (
    username,
    password_hash,
    full_name,
    club_id,
    department_id,
    role,
    department,
    email
  ) VALUES (
    p_username,
    p_password_hash,
    v_full_name,
    p_club_id,
    p_department_id,
    p_role,
    (SELECT name FROM departments WHERE id = p_department_id),
    NULL
  )
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  club_id UUID,
  department_id UUID,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    profiles.full_name,
    profiles.club_id,
    profiles.department_id,
    profiles.role
  FROM profiles
  WHERE username = p_username
    AND password_hash = p_password_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create RLS policy to allow users to insert their own profile during signup
CREATE POLICY "Users can create their own profile during signup" ON profiles
  FOR INSERT WITH CHECK (true);
