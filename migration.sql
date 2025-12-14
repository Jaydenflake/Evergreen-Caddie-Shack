-- Evergreen Team Communication & Recognition App Database Schema
-- This migration creates all necessary tables, relationships, and policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Users/Employees table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  nominator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  core_value_id UUID NOT NULL REFERENCES core_values(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
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
-- MAGIC MOMENTS (HOSPITALITY SPOTLIGHT)
-- =============================================

-- Magic moments/spotlight posts
CREATE TABLE magic_moments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Likes on magic moments
CREATE TABLE magic_moment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  magic_moment_id UUID NOT NULL REFERENCES magic_moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(magic_moment_id, user_id)
);

-- Comments on magic moments
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

-- Nominations indexes
CREATE INDEX idx_nominations_nominator ON nominations(nominator_id);
CREATE INDEX idx_nominations_nominee ON nominations(nominee_id);
CREATE INDEX idx_nominations_value ON nominations(core_value_id);
CREATE INDEX idx_nominations_created ON nominations(created_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Magic moments indexes
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

-- =============================================
-- TRIGGERS FOR COUNTERS
-- =============================================

-- Function to update magic moment likes count
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

-- Function to update magic moment comments count
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

-- Profiles: All authenticated users can read, users can update their own profile
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Core values: Read-only for everyone
CREATE POLICY "Core values are viewable by everyone" ON core_values
  FOR SELECT USING (true);

-- Nominations: Users can create, view all
CREATE POLICY "Users can view all nominations" ON nominations
  FOR SELECT USING (true);

CREATE POLICY "Users can create nominations" ON nominations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their nominations" ON nominations
  FOR UPDATE USING (nominator_id = auth.uid());

-- Channels: Read-only for all authenticated users
CREATE POLICY "Channels are viewable by everyone" ON channels
  FOR SELECT USING (true);

-- Messages: Users can view and create messages in their channels
CREATE POLICY "Users can view all messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (user_id = auth.uid());

-- Channel members: Users can view and join channels
CREATE POLICY "Users can view channel members" ON channel_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join channels" ON channel_members
  FOR INSERT WITH CHECK (true);

-- Magic moments: All users can view, create, and interact
CREATE POLICY "Magic moments are viewable by everyone" ON magic_moments
  FOR SELECT USING (true);

CREATE POLICY "Users can create magic moments" ON magic_moments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their magic moments" ON magic_moments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their magic moments" ON magic_moments
  FOR DELETE USING (author_id = auth.uid());

-- Magic moment likes: Users can like and unlike
CREATE POLICY "Likes are viewable by everyone" ON magic_moment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like magic moments" ON magic_moment_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can unlike magic moments" ON magic_moment_likes
  FOR DELETE USING (user_id = auth.uid());

-- Magic moment comments: Users can comment
CREATE POLICY "Comments are viewable by everyone" ON magic_moment_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON magic_moment_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their comments" ON magic_moment_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their comments" ON magic_moment_comments
  FOR DELETE USING (user_id = auth.uid());

-- Announcements: All can view, authenticated can create
CREATE POLICY "Announcements are viewable by everyone" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Users can create announcements" ON announcements
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authors can update their announcements" ON announcements
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their announcements" ON announcements
  FOR DELETE USING (author_id = auth.uid());

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

-- Storage policies for magic moments
CREATE POLICY "Magic moment media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'magic-moments');

CREATE POLICY "Users can upload magic moment media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'magic-moments');

CREATE POLICY "Users can delete their magic moment media" ON storage.objects
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
INSERT INTO profiles (id, email, full_name, role, department, phone, location) VALUES
  ('00000000-0000-0000-0000-000000000001', 'john.smith@evergreen.com', 'John Smith', 'General Manager', 'Clubhouse', '555-0101', 'Castle Rock, CO'),
  ('00000000-0000-0000-0000-000000000002', 'sarah.johnson@evergreen.com', 'Sarah Johnson', 'Head Golf Pro', 'Golf Pro Shop', '555-0102', 'Castle Rock, CO'),
  ('00000000-0000-0000-0000-000000000003', 'mike.williams@evergreen.com', 'Mike Williams', 'Executive Chef', 'Food & Beverage', '555-0103', 'Castle Rock, CO'),
  ('00000000-0000-0000-0000-000000000004', 'emily.davis@evergreen.com', 'Emily Davis', 'Events Coordinator', 'Events', '555-0104', 'Castle Rock, CO'),
  ('00000000-0000-0000-0000-000000000005', 'david.martinez@evergreen.com', 'David Martinez', 'Maintenance Supervisor', 'Maintenance', '555-0105', 'Castle Rock, CO');

-- Sample announcements
INSERT INTO announcements (author_id, title, content, category, is_pinned) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Welcome to Evergreen!', 'We are thrilled to launch our new team communication platform. This is where we celebrate our values and connect as a team.', 'celebration', true),
  ('00000000-0000-0000-0000-000000000001', 'Safety First Reminder', 'Please remember to follow all safety protocols, especially in the maintenance areas and kitchen.', 'urgent', false),
  ('00000000-0000-0000-0000-000000000004', 'Upcoming Member Event - March 25th', 'Our annual Spring Golf Tournament is coming up! All hands on deck for this special event.', 'info', false);
