import { useEffect, useState } from 'react';
import { Sparkles, Heart, MessageCircle, Upload, Image as ImageIcon, Video, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MagicMoment, CoreValue, Profile } from '../lib/supabase';

export default function MagicMoments() {
  const [moments, setMoments] = useState<MagicMoment[]>([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [teammates, setTeammates] = useState<Profile[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedTeammate, setSelectedTeammate] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Mock current user
  const currentUserId = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [momentsRes, teammatesRes, valuesRes] = await Promise.all([
        supabase
          .from('magic_moments')
          .select('*, author:profiles!author_id(*), highlighted_teammate:profiles!highlighted_teammate_id(*), core_value:core_values(*)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('core_values').select('*').order('name'),
      ]);

      if (momentsRes.data) setMoments(momentsRes.data);
      if (teammatesRes.data) setTeammates(teammatesRes.data);
      if (valuesRes.data) setCoreValues(valuesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeammate || !description.trim()) return;

    try {
      let mediaUrl = null;
      let mediaType: 'image' | 'video' | 'none' = 'none';

      // Upload media if present
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('magic-moments')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('magic-moments')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      await supabase.from('magic_moments').insert({
        author_id: currentUserId,
        highlighted_teammate_id: selectedTeammate,
        core_value_id: selectedValue || null,
        description: description.trim(),
        media_type: mediaType,
        media_url: mediaUrl,
      });

      // Reset form
      setSelectedTeammate('');
      setSelectedValue('');
      setDescription('');
      setMediaFile(null);
      setShowPostForm(false);

      // Refresh moments
      fetchData();
    } catch (error) {
      console.error('Error posting magic moment:', error);
    }
  };

  const toggleLike = async (momentId: string, hasLiked: boolean) => {
    try {
      if (hasLiked) {
        await supabase
          .from('magic_moment_likes')
          .delete()
          .eq('magic_moment_id', momentId)
          .eq('user_id', currentUserId);
      } else {
        await supabase.from('magic_moment_likes').insert({
          magic_moment_id: momentId,
          user_id: currentUserId,
        });
      }
      fetchData();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-8 shadow-xl shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-teal-400" />
                Magic Moments
              </h1>
              <p className="text-gray-600">Celebrate exceptional hospitality and recognize your teammates</p>
            </div>
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 rounded-xl text-gray-900 font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              Share Moment
            </button>
          </div>
        </div>

        {/* Post Form */}
        {showPostForm && (
          <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share a Magic Moment</h3>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Highlight Teammate
              </label>
              <div className="relative">
                <select
                  value={selectedTeammate}
                  onChange={(e) => setSelectedTeammate(e.target.value)}
                  className="w-full bg-emerald-50 border border-emerald-300 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select a teammate...</option>
                  {teammates.map((teammate) => (
                    <option key={teammate.id} value={teammate.id}>
                      {teammate.full_name} - {teammate.role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Evergreen Value (Optional)
              </label>
              <div className="relative">
                <select
                  value={selectedValue}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-full bg-emerald-50 border border-emerald-300 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select a core value...</option>
                  {coreValues.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Describe the Magic Moment
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what made this moment special..."
                rows={4}
                className="w-full bg-emerald-50 border border-emerald-300 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Add Photo or Video (Optional)
              </label>
              <div className="bg-emerald-50 border border-emerald-300 border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {mediaFile ? mediaFile.name : 'Click to upload image or video'}
                  </p>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 rounded-xl text-gray-900 font-medium shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
              >
                Post Magic Moment
              </button>
              <button
                type="button"
                onClick={() => setShowPostForm(false)}
                className="px-6 py-3 rounded-xl bg-gray-300/50 text-gray-900 hover:bg-gray-300/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-strong rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : moments.length === 0 ? (
            <div className="glass-strong rounded-2xl p-12 text-center">
              <Sparkles className="w-16 h-16 text-emerald-600/30 mx-auto mb-4" />
              <p className="text-gray-600/50 text-lg">No magic moments yet. Be the first to share!</p>
            </div>
          ) : (
            moments.map((moment) => (
              <div key={moment.id} className="glass-strong rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
                {/* Post Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-gray-900 font-semibold text-lg shrink-0">
                    {moment.author?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {moment.author?.full_name || 'Unknown'}
                      </span>
                      <span className="text-gray-600/70">recognized</span>
                      <span className="font-semibold text-teal-400">
                        {moment.highlighted_teammate?.full_name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600/50">
                        {new Date(moment.created_at).toLocaleDateString()}
                      </span>
                      {moment.core_value && (
                        <>
                          <span className="text-gray-600/50">•</span>
                          <span className="text-sm px-2 py-1 bg-emerald-500/20 text-emerald-600 rounded-full">
                            {moment.core_value.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-900 mb-4 leading-relaxed">{moment.description}</p>

                {/* Media */}
                {moment.media_url && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-emerald-200">
                    {moment.media_type === 'image' ? (
                      <img src={moment.media_url} alt="Magic moment" className="w-full" />
                    ) : moment.media_type === 'video' ? (
                      <video src={moment.media_url} controls className="w-full" />
                    ) : null}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-emerald-200">
                  <button
                    onClick={() => toggleLike(moment.id, false)}
                    className="flex items-center gap-2 text-gray-600 hover:text-pink-400 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-medium">{moment.likes_count}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-teal-400 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{moment.comments_count}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
