-- Evergreen Team Communication & Recognition App Database Schema
-- This migration creates all necessary tables, relationships, and policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the initial clubs
INSERT INTO clubs (id, name, location) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Blackthorn Club', 'Jonesborough, TN'),
  ('00000000-0000-0000-0000-000000000020', 'Governors Towne Club', 'Acworth, GA'),
  ('00000000-0000-0000-0000-000000000030', 'Service Center', 'Corporate');

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the departments
INSERT INTO departments (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000100', 'Food & Beverage', 'Food and beverage operations'),
  ('00000000-0000-0000-0000-000000000200', 'Golf', 'Golf operations and pro shop'),
  ('00000000-0000-0000-0000-000000000300', 'Maintenance', 'Facility and grounds maintenance'),
  ('00000000-0000-0000-0000-000000000400', 'Amenities', 'Club amenities and member services'),
  ('00000000-0000-0000-0000-000000000500', 'Service Center', 'Central support services for all clubs');

-- Employees table (validated employee names from SFTP CSV)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  company_title TEXT,
  department_title TEXT,
  job_title TEXT,
  club TEXT, -- Computed from company_title
  department TEXT, -- Computed from department_title
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users/Employees table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE SET NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  email TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL, -- Legacy field, keeping for compatibility
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_service_center_club CHECK (
    (department_id = '00000000-0000-0000-0000-000000000500' AND club_id IS NULL) OR
    (department_id != '00000000-0000-0000-0000-000000000500' AND club_id IS NOT NULL)
  )
);

-- Create unique index on username
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Create index for admin lookups
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- Evergreen Core Values
CREATE TABLE core_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 5 Evergreen core values
INSERT INTO core_values (name, tagline, description, icon_name) VALUES
  ('Relentless Hospitality', 'emphasis on exceptional experiences', 'We obsess over our people and processes to perfect the art of creating magic and delivering and experiencing memorable moments. All will receive a warm welcome and fond farewell. We know that doing the little things well, makes all the difference.', 'heart'),
  ('Play Ready Golf', 'proactive sense of urgency', 'Our responsiveness enables people to feel seen and valued - we eagerly anticipate opportunities and are quick to adjust and adapt. We fear missing the opportunity of a lifetime by not taking advantage in the lifetime of the opportunity.', 'clock'),
  ('Spend Time on the Range', 'continuous improvement', 'In our pursuit of excellence, we are students of our craft - recognizing that constant learning and development is the path to true achievement. We remain curious and aren''t afraid to ask question. Iteration leads to improvement.', 'trending-up'),
  ('Be a Caddie', 'no ego, lend a hand', 'We succeed as we help others achieve. We celebrate the success of others and assume positive intent. Nobody walks alone and all are welcome within our circle. Serving and giving back is good for the soul and good for business.', 'handshake'),
  ('Play It As It Lies', 'integrity and confidence', 'Trust and reputation are our most valuable assets. We embrace our circumstances with an abundant mindset and possess the self-confidence to do what we say. The way we do one thing is the way we do everything.', 'shield-check');

-- =============================================
-- NOMINATIONS SYSTEM
-- =============================================

-- Nominations table
CREATE TABLE nominations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  nominator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nominee_id TEXT NOT NULL, -- Employee name from employees table
  core_value_id UUID NOT NULL REFERENCES core_values(id) ON DELETE CASCADE,
  description TEXT, -- Optional description
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'awarded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MESSAGING SYSTEM
-- =============================================

-- Message channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  department TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default channels
INSERT INTO channels (name, display_name, department, description) VALUES
  ('general', 'General', 'All', 'Company-wide general discussion'),
  ('clubhouse', 'Clubhouse', 'Clubhouse', 'Clubhouse team communications'),
  ('golf-pro-shop', 'Golf Pro Shop', 'Golf Pro Shop', 'Golf pro shop team updates'),
  ('food-beverage', 'Food & Beverage', 'Food & Beverage', 'F&B team coordination'),
  ('maintenance', 'Maintenance', 'Maintenance', 'Maintenance team updates'),
  ('events', 'Events', 'Events', 'Events and special occasions');

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  has_attachment BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channel members (for tracking which users are in which channels)
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- =============================================
-- CREATING MAGIC (HOSPITALITY SPOTLIGHT)
-- =============================================

-- Creating magic/spotlight posts
CREATE TABLE magic_moments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  highlighted_teammate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  core_value_id UUID REFERENCES core_values(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'none')),
  media_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes on creating magic posts
CREATE TABLE magic_moment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  magic_moment_id UUID NOT NULL REFERENCES magic_moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(magic_moment_id, user_id)
);

-- Comments on creating magic posts
CREATE TABLE magic_moment_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  magic_moment_id UUID NOT NULL REFERENCES magic_moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANNOUNCEMENTS
-- =============================================

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('urgent', 'celebration', 'info')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Club indexes
CREATE INDEX idx_profiles_club ON profiles(club_id);
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_nominations_club ON nominations(club_id);
CREATE INDEX idx_messages_club ON messages(club_id);
CREATE INDEX idx_magic_moments_club ON magic_moments(club_id);
CREATE INDEX idx_announcements_club ON announcements(club_id);

-- Employee indexes
CREATE INDEX idx_employees_full_name ON employees(full_name);
CREATE INDEX idx_employees_last_name ON employees(last_name);
CREATE INDEX idx_employees_department_title ON employees(department_title);
CREATE INDEX idx_employees_club ON employees(club);
CREATE INDEX idx_employees_department ON employees(department);

-- Nominations indexes
CREATE INDEX idx_nominations_nominator ON nominations(nominator_id);
CREATE INDEX idx_nominations_nominee ON nominations(nominee_id);
CREATE INDEX idx_nominations_value ON nominations(core_value_id);
CREATE INDEX idx_nominations_created ON nominations(created_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Creating magic indexes
CREATE INDEX idx_magic_moments_author ON magic_moments(author_id);
CREATE INDEX idx_magic_moments_teammate ON magic_moments(highlighted_teammate_id);
CREATE INDEX idx_magic_moments_created ON magic_moments(created_at DESC);

-- Announcements indexes
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX idx_announcements_pinned ON announcements(is_pinned) WHERE is_pinned = TRUE;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nominations_updated_at BEFORE UPDATE ON nominations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_magic_moments_updated_at BEFORE UPDATE ON magic_moments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_magic_moment_comments_updated_at BEFORE UPDATE ON magic_moment_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-populate club and department on insert/update
CREATE TRIGGER employees_populate_club_department
  BEFORE INSERT OR UPDATE OF company_title, department_title ON employees
  FOR EACH ROW
  EXECUTE FUNCTION populate_employee_club_department();

-- =============================================
-- TRIGGERS FOR COUNTERS
-- =============================================

-- Function to update creating magic likes count
CREATE OR REPLACE FUNCTION update_magic_moment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE magic_moments SET likes_count = likes_count + 1 WHERE id = NEW.magic_moment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE magic_moments SET likes_count = likes_count - 1 WHERE id = OLD.magic_moment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update creating magic comments count
CREATE OR REPLACE FUNCTION update_magic_moment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE magic_moments SET comments_count = comments_count + 1 WHERE id = NEW.magic_moment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE magic_moments SET comments_count = comments_count - 1 WHERE id = OLD.magic_moment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply counter triggers
CREATE TRIGGER magic_moment_likes_count_trigger
  AFTER INSERT OR DELETE ON magic_moment_likes
  FOR EACH ROW EXECUTE FUNCTION update_magic_moment_likes_count();

CREATE TRIGGER magic_moment_comments_count_trigger
  AFTER INSERT OR DELETE ON magic_moment_comments
  FOR EACH ROW EXECUTE FUNCTION update_magic_moment_comments_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_moment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_moment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_values ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's club_id
CREATE OR REPLACE FUNCTION get_user_club_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT club_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is Service Center
CREATE OR REPLACE FUNCTION is_service_center_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT department_id = '00000000-0000-0000-0000-000000000500' FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT is_admin FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUTHENTICATION FUNCTIONS
-- =============================================

-- Function to register new user
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

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
  p_username TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  club_id UUID,
  department_id UUID,
  role TEXT,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    profiles.full_name,
    profiles.club_id,
    profiles.department_id,
    profiles.role,
    profiles.is_admin
  FROM profiles
  WHERE username = p_username
    AND password_hash = p_password_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- EMPLOYEE DATA CLEANING FUNCTIONS
-- =============================================

-- Function to extract clean club name from company_title
-- Rules:
--   Contains "Governors" -> "Governors Towne Club"
--   Contains "Blackthorn" -> "Blackthorn Club"
--   Otherwise -> "Service Center"
CREATE OR REPLACE FUNCTION extract_club_name(company_title TEXT)
RETURNS TEXT AS $$
BEGIN
  IF company_title IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check for Governors
  IF company_title ~* 'governors' THEN
    RETURN 'Governors Towne Club';
  END IF;

  -- Check for Blackthorn
  IF company_title ~* 'blackthorn' THEN
    RETURN 'Blackthorn Club';
  END IF;

  -- Everything else is Service Center
  RETURN 'Service Center';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract clean department name from department_title
CREATE OR REPLACE FUNCTION extract_department_name(department_title TEXT)
RETURNS TEXT AS $$
BEGIN
  IF department_title IS NULL THEN
    RETURN NULL;
  END IF;

  -- Remove leading numbers and space (e.g., "30 ", "20 ", "11 ")
  department_title := regexp_replace(department_title, '^\d+\s+', '');

  -- Trim whitespace
  department_title := trim(department_title);

  RETURN department_title;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to populate club and department columns
CREATE OR REPLACE FUNCTION populate_employee_club_department()
RETURNS TRIGGER AS $$
BEGIN
  NEW.club := extract_club_name(NEW.company_title);
  NEW.department := extract_department_name(NEW.department_title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Clubs: All authenticated users can view all clubs
CREATE POLICY "Clubs are viewable by everyone" ON clubs
  FOR SELECT USING (true);

-- Departments: All authenticated users can view all departments
CREATE POLICY "Departments are viewable by everyone" ON departments
  FOR SELECT USING (true);

-- Employees: All authenticated users can read employees
CREATE POLICY "Anyone can read employees" ON employees
  FOR SELECT USING (true);

-- Employees: Only admins can modify employees
CREATE POLICY "Only admins can modify employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'General Manager')
    )
  );

-- Profiles: Allow all authenticated users to read (custom auth doesn't set auth.uid())
CREATE POLICY "Allow all authenticated users to read profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update admin status (but not their own)
CREATE POLICY "Admins can update admin status" ON profiles
  FOR UPDATE USING (
    is_admin_user() AND
    auth.uid() != id
  )
  WITH CHECK (
    is_admin_user() AND
    auth.uid() != id
  );

-- Allow users to create their own profile during signup
CREATE POLICY "Users can create their own profile during signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- Core values: Read-only for everyone
CREATE POLICY "Core values are viewable by everyone" ON core_values
  FOR SELECT USING (true);

-- Nominations: Allow all authenticated users to read (custom auth doesn't set auth.uid())
CREATE POLICY "Allow all authenticated users to read nominations" ON nominations
  FOR SELECT USING (true);

-- Allow all authenticated users to insert nominations
CREATE POLICY "Users can create nominations" ON nominations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own nominations" ON nominations
  FOR UPDATE USING (nominator_id = auth.uid() AND club_id = get_user_club_id());

-- Channels: Read-only for all authenticated users
CREATE POLICY "Channels are viewable by everyone" ON channels
  FOR SELECT USING (true);

-- Messages: Users can see messages from their club, Service Center sees all
CREATE POLICY "Users can view messages from their club or all if Service Center" ON messages
  FOR SELECT USING (
    is_service_center_user() OR
    club_id = get_user_club_id()
  );

CREATE POLICY "Users can create messages for their club" ON messages
  FOR INSERT WITH CHECK (
    club_id = get_user_club_id() AND
    NOT is_service_center_user()
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (user_id = auth.uid() AND club_id = get_user_club_id());

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (user_id = auth.uid() AND club_id = get_user_club_id());

-- Channel members: Users can view and join channels
CREATE POLICY "Users can view channel members" ON channel_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join channels" ON channel_members
  FOR INSERT WITH CHECK (true);

-- Creating magic: Users can see posts from their club, Service Center sees all
CREATE POLICY "Users can view creating magic posts from their club or all if Service Center" ON magic_moments
  FOR SELECT USING (
    is_service_center_user() OR
    club_id = get_user_club_id()
  );

CREATE POLICY "Users can create creating magic posts for their club" ON magic_moments
  FOR INSERT WITH CHECK (
    club_id = get_user_club_id() AND
    NOT is_service_center_user()
  );

CREATE POLICY "Users can update their own creating magic posts" ON magic_moments
  FOR UPDATE USING (author_id = auth.uid() AND club_id = get_user_club_id());

CREATE POLICY "Users can delete their own creating magic posts" ON magic_moments
  FOR DELETE USING (author_id = auth.uid() AND club_id = get_user_club_id());

-- Creating magic likes: Users can like and unlike
CREATE POLICY "Likes are viewable by everyone" ON magic_moment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like creating magic posts" ON magic_moment_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unlike creating magic posts" ON magic_moment_likes
  FOR DELETE USING (user_id = auth.uid());

-- Creating magic comments: Users can comment
CREATE POLICY "Comments are viewable by everyone" ON magic_moment_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON magic_moment_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their comments" ON magic_moment_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their comments" ON magic_moment_comments
  FOR DELETE USING (user_id = auth.uid());

-- Announcements: Users can see announcements from their club, Service Center sees all
CREATE POLICY "Users can view announcements from their club or all if Service Center" ON announcements
  FOR SELECT USING (
    is_service_center_user() OR
    club_id = get_user_club_id()
  );

CREATE POLICY "Users can create announcements for their club" ON announcements
  FOR INSERT WITH CHECK (
    club_id = get_user_club_id() AND
    NOT is_service_center_user()
  );

CREATE POLICY "Authors can update their own announcements" ON announcements
  FOR UPDATE USING (author_id = auth.uid() AND club_id = get_user_club_id());

CREATE POLICY "Authors can delete their own announcements" ON announcements
  FOR DELETE USING (author_id = auth.uid() AND club_id = get_user_club_id());

-- =============================================
-- STORAGE BUCKETS (for images/videos)
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('magic-moments', 'magic-moments', true),
  ('message-attachments', 'message-attachments', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Storage policies for creating magic
CREATE POLICY "Creating magic media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'magic-moments');

CREATE POLICY "Users can upload creating magic media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'magic-moments');

CREATE POLICY "Users can delete their creating magic media" ON storage.objects
  FOR DELETE USING (bucket_id = 'magic-moments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for message attachments
CREATE POLICY "Message attachments are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'message-attachments');

-- =============================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =============================================

-- Sample profiles (you can add real employee data later)
-- Note: password for all sample users is "password" (hashed as base64: cGFzc3dvcmQ=)
INSERT INTO profiles (id, club_id, department_id, username, password_hash, email, full_name, role, department, phone, location) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000400', 'jsmith', 'cGFzc3dvcmQ=', 'john.smith@evergreen.com', 'John Smith', 'General Manager', 'Amenities', '555-0101', 'Jonesborough, TN'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000200', 'sjohnson', 'cGFzc3dvcmQ=', 'sarah.johnson@evergreen.com', 'Sarah Johnson', 'Head Golf Pro', 'Golf', '555-0102', 'Jonesborough, TN'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000100', 'mwilliams', 'cGFzc3dvcmQ=', 'mike.williams@evergreen.com', 'Mike Williams', 'Executive Chef', 'Food & Beverage', '555-0103', 'Jonesborough, TN'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000400', 'edavis', 'cGFzc3dvcmQ=', 'emily.davis@evergreen.com', 'Emily Davis', 'Events Coordinator', 'Amenities', '555-0104', 'Jonesborough, TN'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000300', 'dmartinez', 'cGFzc3dvcmQ=', 'david.martinez@evergreen.com', 'David Martinez', 'Maintenance Supervisor', 'Maintenance', '555-0105', 'Jonesborough, TN');

-- Sample announcements
INSERT INTO announcements (club_id, author_id, title, content, category, is_pinned) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Welcome to Evergreen!', 'We are thrilled to launch our new team communication platform. This is where we celebrate our values and connect as a team.', 'celebration', true),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Safety First Reminder', 'Please remember to follow all safety protocols, especially in the maintenance areas and kitchen.', 'urgent', false),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'Upcoming Member Event - March 25th', 'Our annual Spring Golf Tournament is coming up! All hands on deck for this special event.', 'info', false);
