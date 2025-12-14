import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Announcement, Message } from '../lib/supabase';

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch latest announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*, author:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*, user:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementsData) setAnnouncements(announcementsData);
      if (messagesData) setRecentMessages(messagesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Header */}
      <div className="glass-strong rounded-3xl p-8 shadow-xl shadow-emerald-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to Evergreen
        </h1>
        <p className="text-gray-600 text-lg">
          Creating vibrant and connected communities through relentless hospitality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="glass-strong rounded-2xl p-6 shadow-xl shadow-purple-500/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-xl">
                <Bell className="w-5 h-5 text-gray-900" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Announcements</h2>
            </div>
            <Link
              to="/announcements"
              className="text-sm text-emerald-400 hover:text-emerald-600"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200/50 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-gray-600/50 text-center py-8">No announcements yet</p>
              ) : (
                announcements.map((announcement) => (
                  <Link
                    key={announcement.id}
                    to="/announcements"
                    className="block bg-gradient-to-r from-purple-900/20 to-emerald-900/20 hover:from-purple-900/30 hover:to-emerald-900/30 rounded-xl p-4 transition-all border border-purple-500/20"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-600/70 line-clamp-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        announcement.category === 'urgent'
                          ? 'bg-red-500/20 text-red-300'
                          : announcement.category === 'celebration'
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {announcement.category}
                      </span>
                      <span className="text-xs text-gray-600/50">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="glass-strong rounded-2xl p-6 shadow-xl shadow-emerald-500/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
                <MessageSquare className="w-5 h-5 text-gray-900" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Messages</h2>
            </div>
            <Link
              to="/messages"
              className="text-sm text-emerald-400 hover:text-emerald-600"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-200/50 rounded-xl p-3 animate-pulse">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.length === 0 ? (
                <p className="text-gray-600/50 text-center py-8">No messages yet</p>
              ) : (
                recentMessages.map((message) => (
                  <Link
                    key={message.id}
                    to="/messages"
                    className="block bg-white border border-emerald-200 hover:bg-emerald-50 border border-emerald-300 rounded-xl p-3 transition-all border border-emerald-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-emerald-600 text-sm">
                        {message.user?.full_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-600/50">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900/80 line-clamp-1">
                      {message.content}
                    </p>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <p className="text-gray-600/70 text-sm">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">42</p>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
              <Bell className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <p className="text-gray-600/70 text-sm">Active Channels</p>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-teal-400 to-emerald-600 p-3 rounded-xl">
              <MessageSquare className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <p className="text-gray-600/70 text-sm">This Week</p>
              <p className="text-2xl font-bold text-gray-900">127 Messages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
