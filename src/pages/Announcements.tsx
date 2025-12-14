import { useEffect, useState } from 'react';
import { Bell, Pin, Calendar, AlertCircle, PartyPopper, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Announcement } from '../lib/supabase';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();

    // Subscribe to new announcements
    const subscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*, author:profiles(*)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5" />;
      case 'celebration':
        return <PartyPopper className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'urgent':
        return {
          badge: 'bg-red-500/20 text-red-300 border-red-500/30',
          card: 'border-red-500/50 shadow-red-500/20',
          gradient: 'from-red-900/30 to-red-900/10',
        };
      case 'celebration':
        return {
          badge: 'bg-emerald-500/20 text-emerald-600 border-emerald-200',
          card: 'border-emerald-500/50 shadow-emerald-200',
          gradient: 'from-emerald-900/30 to-emerald-900/10',
        };
      case 'info':
        return {
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          card: 'border-blue-500/50 shadow-blue-500/20',
          gradient: 'from-blue-900/30 to-blue-900/10',
        };
      default:
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          card: 'border-purple-500/50 shadow-purple-500/20',
          gradient: 'from-purple-900/30 to-purple-900/10',
        };
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-8 shadow-xl shadow-purple-500/20">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-400" />
            Announcements
          </h1>
          <p className="text-gray-600">
            Stay updated with important team news and celebrations
          </p>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-strong rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="glass-strong rounded-2xl p-12 text-center">
              <Bell className="w-16 h-16 text-emerald-600/30 mx-auto mb-4" />
              <p className="text-gray-600/50 text-lg">No announcements yet</p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const styles = getCategoryStyles(announcement.category);
              const CategoryIcon = getCategoryIcon(announcement.category);

              return (
                <div
                  key={announcement.id}
                  className={`glass-strong rounded-2xl p-6 shadow-xl border-2 ${
                    announcement.is_pinned
                      ? 'border-emerald-500/50 shadow-emerald-500/30'
                      : styles.card
                  } transition-all hover:shadow-2xl`}
                >
                  {/* Pinned Badge */}
                  {announcement.is_pinned && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2 border border-emerald-200">
                        <Pin className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-600">Pinned</span>
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {announcement.title}
                      </h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${styles.badge}`}>
                          {CategoryIcon}
                          <span className="text-sm font-medium capitalize">
                            {announcement.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600/70 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`bg-gradient-to-br ${styles.gradient} rounded-xl p-4 mb-4 border border-white/5`}>
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 text-sm text-gray-600/70">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-gray-900 font-semibold">
                      {announcement.author?.full_name?.charAt(0) || 'A'}
                    </div>
                    <span>
                      Posted by <span className="font-medium text-gray-600">
                        {announcement.author?.full_name || 'Unknown'}
                      </span>
                    </span>
                    {announcement.author?.role && (
                      <>
                        <span>•</span>
                        <span>{announcement.author.role}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Card */}
        <div className="glass-strong rounded-2xl p-6 shadow-xl border border-purple-500/30">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            About Announcements
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-1 shrink-0" />
              <span><span className="font-semibold text-red-300">Urgent</span> - Time-sensitive information requiring immediate attention</span>
            </li>
            <li className="flex items-start gap-2">
              <PartyPopper className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span><span className="font-semibold text-emerald-600">Celebration</span> - Team achievements, milestones, and wins</span>
            </li>
            <li className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-1 shrink-0" />
              <span><span className="font-semibold text-blue-300">Info</span> - General updates and helpful information</span>
            </li>
            <li className="flex items-start gap-2">
              <Pin className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
              <span><span className="font-semibold text-emerald-600">Pinned</span> - Important announcements stay at the top</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
