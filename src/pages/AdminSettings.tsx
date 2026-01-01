import { useEffect, useState } from 'react';
import { Shield, UserPlus, UserMinus, Search, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (user && !user.is_admin) {
      navigate('/');
      return;
    }

    fetchProfiles();
  }, [user, navigate]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      if (data) {
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (profileId: string, currentStatus: boolean, userName: string) => {
    if (profileId === user?.id) {
      setErrorMessage("You cannot change your own admin status");
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setSubmitting(profileId);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', profileId);

      if (error) {
        console.error('Error updating admin status:', error);
        setErrorMessage(`Failed to update admin status: ${error.message}`);
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      // Update local state
      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, is_admin: !currentStatus } : p
      ));

      // Show success message
      const action = !currentStatus ? 'granted' : 'revoked';
      setSuccessMessage(`Admin access ${action} for ${userName}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error('Error updating admin status:', error);
      setErrorMessage('An unexpected error occurred');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setSubmitting(null);
    }
  };

  // Filter profiles based on search
  const filteredProfiles = profiles.filter(profile =>
    profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate admins and non-admins
  const admins = filteredProfiles.filter(p => p.is_admin);
  const nonAdmins = filteredProfiles.filter(p => !p.is_admin);

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-8 shadow-xl shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-emerald-400" />
                Admin Settings
              </h1>
              <p className="text-gray-600">
                Manage admin access and permissions for users
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="glass-strong rounded-2xl p-6 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Success!</h3>
                <p className="text-gray-600 text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="glass-strong rounded-2xl p-6 border-2 border-red-500/50 shadow-xl shadow-red-500/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Error</h3>
                <p className="text-gray-600 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="w-full bg-emerald-50 border border-emerald-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-emerald-600/70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Current Admins */}
        <div className="glass-strong rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Current Admins ({admins.length})
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No admins found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 flex items-center justify-between border border-emerald-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{profile.full_name}</div>
                      <div className="text-sm text-gray-600">
                        {profile.email || profile.username || 'No contact info'}
                      </div>
                      <div className="text-xs text-gray-500">{profile.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAdminStatus(profile.id, profile.is_admin, profile.full_name)}
                    disabled={submitting === profile.id || profile.id === user?.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                    {submitting === profile.id ? 'Updating...' : 'Revoke Admin'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Non-Admin Users */}
        <div className="glass-strong rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-400" />
            Grant Admin Access ({nonAdmins.length} users)
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : nonAdmins.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No non-admin users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nonAdmins.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-emerald-50/50 rounded-xl p-4 flex items-center justify-between border border-emerald-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-lg">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{profile.full_name}</div>
                      <div className="text-sm text-gray-600">
                        {profile.email || profile.username || 'No contact info'}
                      </div>
                      <div className="text-xs text-gray-500">{profile.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAdminStatus(profile.id, profile.is_admin, profile.full_name)}
                    disabled={submitting === profile.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    {submitting === profile.id ? 'Updating...' : 'Grant Admin'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
