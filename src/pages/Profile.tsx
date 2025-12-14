import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Award, TrendingUp, Users, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile as ProfileType, Nomination, CoreValue } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [stats, setStats] = useState({
    nominationsReceived: 0,
    awardsWon: 0,
    givenNominations: 0,
    teamConnections: 42,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, club:clubs(*), department_obj:departments(*)')
        .eq('id', user.id)
        .single();

      // Fetch nominations received
      const { data: receivedNominations } = await supabase
        .from('nominations')
        .select('*, nominator:profiles!nominator_id(*), core_value:core_values(*)')
        .eq('nominee_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch nominations given
      const { data: givenNominations } = await supabase
        .from('nominations')
        .select('id')
        .eq('nominator_id', user.id);

      // Fetch core values
      const { data: valuesData } = await supabase
        .from('core_values')
        .select('*');

      if (profileData) setProfile(profileData);
      if (receivedNominations) setNominations(receivedNominations);
      if (valuesData) setCoreValues(valuesData);

      // Calculate stats
      const receivedCount = receivedNominations?.length || 0;
      const givenCount = givenNominations?.length || 0;
      const approvedCount = receivedNominations?.filter((n) => n.status === 'awarded').length || 0;

      setStats({
        nominationsReceived: receivedCount,
        awardsWon: approvedCount,
        givenNominations: givenCount,
        teamConnections: 42,
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate value distribution
  const getValueDistribution = () => {
    if (!nominations.length || !coreValues.length) return [];

    const distribution = coreValues.map((value) => {
      const count = nominations.filter((n) => n.core_value_id === value.id).length;
      const percentage = nominations.length > 0 ? (count / nominations.length) * 100 : 0;
      return {
        value,
        count,
        percentage,
      };
    });

    return distribution.sort((a, b) => b.count - a.count);
  };

  const valueDistribution = getValueDistribution();

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-strong rounded-2xl p-8 animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-600/50">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="glass-strong rounded-3xl p-8 shadow-xl shadow-emerald-200">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-gray-900 text-4xl font-bold shadow-xl shadow-emerald-500/30 shrink-0">
              {profile.full_name.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.full_name}</h1>
              <p className="text-xl text-emerald-600 mb-4">{profile.role}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">Joined {new Date(profile.join_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-strong rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <Award className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <p className="text-gray-600/70 text-sm">Nominations Received</p>
                <p className="text-3xl font-bold text-gray-900">{stats.nominationsReceived}</p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <p className="text-gray-600/70 text-sm">Awards Won</p>
                <p className="text-3xl font-bold text-gray-900">{stats.awardsWon}</p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-teal-400 to-emerald-600 p-3 rounded-xl">
                <Heart className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <p className="text-gray-600/70 text-sm">Given Nominations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.givenNominations}</p>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-600 to-green-700 p-3 rounded-xl">
                <Users className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <p className="text-gray-600/70 text-sm">Team Connections</p>
                <p className="text-3xl font-bold text-gray-900">{stats.teamConnections}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values Recognition */}
        <div className="glass-strong rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-emerald-400" />
            Core Values Recognition
          </h2>

          {valueDistribution.length === 0 ? (
            <p className="text-gray-600/50 text-center py-8">No recognitions yet</p>
          ) : (
            <div className="space-y-4">
              {valueDistribution.map(({ value, count, percentage }) => (
                <div key={value.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{value.name}</h3>
                      <p className="text-sm text-gray-600/70 italic">{value.tagline}</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">
                      {count} {count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-950/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/50"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Recognitions */}
        <div className="glass-strong rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Heart className="w-7 h-7 text-pink-400" />
            Recent Recognitions
          </h2>

          {nominations.length === 0 ? (
            <p className="text-gray-600/50 text-center py-8">No nominations received yet</p>
          ) : (
            <div className="space-y-4">
              {nominations.slice(0, 5).map((nomination) => (
                <div
                  key={nomination.id}
                  className="bg-gradient-to-r from-emerald-900/20 to-purple-900/20 rounded-xl p-4 border border-emerald-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-gray-900 font-semibold shrink-0">
                      {nomination.nominator?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {nomination.nominator?.full_name || 'Someone'}
                        </span>
                        <span className="text-gray-600/70">recognized you for</span>
                        {nomination.core_value && (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-600 rounded-full text-sm">
                            {nomination.core_value.name}
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-100 leading-relaxed mb-2">
                        {nomination.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600/50">
                          {new Date(nomination.created_at).toLocaleDateString()}
                        </span>
                        {nomination.status === 'awarded' && (
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                            Awarded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
