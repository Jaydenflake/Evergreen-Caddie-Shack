import { useEffect, useState } from 'react';
import { Search, Hash, Send, Paperclip, Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Channel, Message } from '../lib/supabase';

export default function Messages() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock current user - in production this would come from auth context
  const currentUserId = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      // Subscribe to new messages
      const subscription = supabase
        .channel(`messages:${selectedChannel.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${selectedChannel.id}`,
          },
          () => {
            fetchMessages(selectedChannel.id);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .order('name');

      if (data) {
        setChannels(data);
        if (data.length > 0) {
          setSelectedChannel(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*, user:profiles(*)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      await supabase.from('messages').insert({
        channel_id: selectedChannel.id,
        user_id: currentUserId,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredChannels = channels.filter((channel) =>
    channel.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex">
      {/* Channels Sidebar */}
      <aside className="w-80 glass-strong border-r border-emerald-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-emerald-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-3 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full text-left p-4 rounded-xl transition-all font-medium ${
                  selectedChannel?.id === channel.id
                    ? 'card-emerald'
                    : 'card-light hover:shadow-lg text-gray-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Hash className={`w-5 h-5 ${selectedChannel?.id === channel.id ? 'text-white' : 'text-emerald-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${selectedChannel?.id === channel.id ? 'text-white' : 'text-gray-900'}`}>
                      {channel.display_name}
                    </p>
                    {channel.department && (
                      <p className={`text-xs truncate ${selectedChannel?.id === channel.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {channel.department}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="glass-strong border-b border-emerald-200 p-6">
              <div className="flex items-center gap-3">
                <Hash className="w-6 h-6 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedChannel.display_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedChannel.description || selectedChannel.department}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-emerald-50/30 via-blue-50/30 to-purple-50/30">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {message.user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {message.user?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-emerald-200 shadow-sm">
                        <p className="text-gray-800">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="glass-strong border-t border-emerald-200 p-4">
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  className="p-2 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-emerald-600" />
                </button>
                <div className="flex-1 bg-white border border-emerald-200 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder={`Message #${selectedChannel.display_name}`}
                    rows={1}
                    className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="button"
                  className="p-2 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  <Smile className="w-5 h-5 text-emerald-600" />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-emerald-200/50">Select a channel to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
