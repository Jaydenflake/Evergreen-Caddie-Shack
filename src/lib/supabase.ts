import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  join_date: string;
  created_at: string;
  updated_at: string;
}

export interface CoreValue {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon_name?: string;
  created_at: string;
}

export interface Nomination {
  id: string;
  nominator_id: string;
  nominee_id: string;
  core_value_id: string;
  description: string;
  status: 'pending' | 'approved' | 'awarded';
  created_at: string;
  updated_at: string;
  nominator?: Profile;
  nominee?: Profile;
  core_value?: CoreValue;
}

export interface Channel {
  id: string;
  name: string;
  display_name: string;
  department?: string;
  description?: string;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  has_attachment: boolean;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface MagicMoment {
  id: string;
  author_id: string;
  highlighted_teammate_id: string;
  core_value_id?: string;
  description: string;
  media_type?: 'image' | 'video' | 'none';
  media_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  highlighted_teammate?: Profile;
  core_value?: CoreValue;
}

export interface MagicMomentLike {
  id: string;
  magic_moment_id: string;
  user_id: string;
  created_at: string;
}

export interface MagicMomentComment {
  id: string;
  magic_moment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: 'urgent' | 'celebration' | 'info';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
}
