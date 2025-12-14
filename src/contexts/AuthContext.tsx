import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  club_id: string | null;
  department_id: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const sessionData = localStorage.getItem('auth_user');
    if (sessionData) {
      const userData = JSON.parse(sessionData);
      setUser(userData);
      fetchProfile(userData.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, club:clubs(*), department_obj:departments(*)')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // Hash password with bcrypt (we'll use a simple hash for now, should use bcrypt in production)
      const passwordHash = btoa(password); // Simple base64 encoding - replace with bcrypt in production

      const { data, error } = await supabase
        .rpc('authenticate_user', {
          p_username: username,
          p_password_hash: passwordHash,
        });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Invalid username or password');
      }

      const userData: AuthUser = {
        id: data[0].user_id,
        username: username,
        full_name: data[0].full_name,
        club_id: data[0].club_id,
        department_id: data[0].department_id,
        role: data[0].role,
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      await fetchProfile(userData.id);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
