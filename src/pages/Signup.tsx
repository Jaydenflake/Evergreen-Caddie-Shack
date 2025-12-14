import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Club, Department } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clubId, setClubId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClubsAndDepartments();
  }, []);

  const fetchClubsAndDepartments = async () => {
    try {
      const [clubsRes, depsRes] = await Promise.all([
        supabase.from('clubs').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
      ]);

      if (clubsRes.data) setClubs(clubsRes.data);
      if (depsRes.data) setDepartments(depsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!clubId && departmentId !== departments.find(d => d.name === 'Service Center')?.id) {
      setError('Please select a club (unless you are in Service Center)');
      return;
    }

    setLoading(true);

    try {
      // Hash password (simple base64 for now, should use bcrypt in production)
      const passwordHash = btoa(password);

      const { data, error: rpcError } = await supabase.rpc('register_user', {
        p_username: username,
        p_password_hash: passwordHash,
        p_first_name: firstName,
        p_last_name: lastName,
        p_club_id: clubId || null,
        p_department_id: departmentId,
        p_role: 'Team Member',
      });

      if (rpcError) {
        if (rpcError.message.includes('unique')) {
          setError('Username already exists. Please choose a different username.');
        } else {
          setError('Failed to create account. Please try again.');
        }
        console.error('Signup error:', rpcError);
        return;
      }

      // Success! Redirect to login
      navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } });
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isServiceCenter = departmentId === departments.find(d => d.name === 'Service Center')?.id;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-8 shadow-xl text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UserPlus className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          </div>
          <p className="text-gray-600">Join the Evergreen team</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-strong rounded-2xl p-4 border-2 border-red-500/50 bg-red-50">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8 shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={3}
            />
            <p className="text-gray-600/50 text-xs mt-1">At least 3 characters</p>
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={8}
            />
            <p className="text-gray-600/50 text-xs mt-1">At least 8 characters</p>
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Department
            </label>
            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select your department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
            </div>
          </div>

          {!isServiceCenter && (
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Club
              </label>
              <div className="relative">
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required={!isServiceCenter}
                >
                  <option value="">Select your club...</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name} - {club.location}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 rounded-2xl text-gray-900 text-lg font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
