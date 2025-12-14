import { useEffect, useState } from 'react';
import { Award, ChevronDown, CheckCircle, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, CoreValue } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Nominate() {
  const { user } = useAuth();
  const [teammates, setTeammates] = useState<Profile[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [selectedTeammate, setSelectedTeammate] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValuesModal, setShowValuesModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teammatesRes, valuesRes] = await Promise.all([
        supabase.from('profiles').select('*, club:clubs(*)').order('full_name'),
        supabase.from('core_values').select('*').order('name'),
      ]);

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

    if (!user) return;

    // Get the nominee's club_id for the nomination
    const nominee = teammates.find(t => t.id === selectedTeammate);
    if (!nominee) return;

    try {
      await supabase.from('nominations').insert({
        club_id: nominee.club_id || user.club_id,
        nominator_id: user.id,
        nominee_id: selectedTeammate,
        core_value_id: selectedValue,
        description: description.trim(),
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // Reset form
      setSelectedTeammate('');
      setSelectedValue('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting nomination:', error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-8 shadow-xl shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Award className="w-8 h-8 text-emerald-400" />
                Nominate a Teammate
              </h1>
              <p className="text-gray-600">
                Recognize excellence and celebrate teammates who embody our core values
              </p>
            </div>
            <button
              onClick={() => setShowValuesModal(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 rounded-xl text-gray-900 text-sm font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              View Values
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="glass-strong rounded-2xl p-6 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Nomination Submitted!</h3>
                <p className="text-gray-600 text-sm">
                  Your nomination has been submitted for review. Thank you for recognizing excellence!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nomination Form */}
        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8 shadow-xl space-y-6">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Select Teammate
            </label>
            <div className="relative">
              <select
                value={selectedTeammate}
                onChange={(e) => setSelectedTeammate(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-300 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Choose a teammate to nominate...</option>
                {teammates
                  .filter((t) => t.id !== user?.id)
                  .map((teammate) => (
                    <option key={teammate.id} value={teammate.id}>
                      {teammate.full_name} - {teammate.role} {teammate.club?.name ? `(${teammate.club.name})` : ''}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Core Value
            </label>
            <div className="relative">
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-300 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select an Evergreen value...</option>
                {coreValues.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.name} - {value.tagline}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Why are you nominating this teammate?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how this teammate demonstrated this core value. Be specific about what they did and the impact it had..."
              rows={6}
              className="w-full bg-emerald-50 border border-emerald-300 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 placeholder-emerald-600/70 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              required
            />
            <p className="text-gray-600/50 text-sm mt-2">
              Minimum 50 characters. Be descriptive!
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || description.length < 50}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 rounded-2xl text-gray-900 text-lg font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Nomination
          </button>
        </form>

        {/* Recent Nominations Info */}
        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Why Nominate?
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">•</span>
              <span>Recognize teammates who go above and beyond</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">•</span>
              <span>Celebrate our core values in action</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">•</span>
              <span>Build a culture of appreciation and excellence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">•</span>
              <span>Contribute to team member recognition and rewards</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Evergreen Values Modal */}
      {showValuesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-strong rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Evergreen Values</h2>
              <button
                onClick={() => setShowValuesModal(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {coreValues.map((value, index) => (
                <div
                  key={value.id}
                  className="bg-gradient-to-r from-emerald-900/30 to-purple-900/30 rounded-2xl p-6 border border-emerald-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-10 h-10 rounded-xl flex items-center justify-center text-gray-900 font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{value.name}</h3>
                      <p className="text-emerald-600 italic mb-3">{value.tagline}</p>
                      <p className="text-emerald-100 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowValuesModal(false)}
              className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 rounded-xl text-gray-900 font-medium shadow-lg shadow-emerald-500/30"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
