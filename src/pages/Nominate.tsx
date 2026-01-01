import { useEffect, useState, useMemo } from 'react';
import { Award, ChevronDown, CheckCircle, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Club, CoreValue, Employee } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Nominate() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);

  // Form state
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [description, setDescription] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showValuesModal, setShowValuesModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clubsRes, employeesRes, valuesRes] = await Promise.all([
        supabase.from('clubs').select('*').order('name'),
        supabase.from('employees').select('*').order('full_name'),
        supabase.from('core_values').select('*').order('name'),
      ]);

      if (clubsRes.data) setClubs(clubsRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (valuesRes.data) setCoreValues(valuesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique clubs from all employees
  const availableClubs = useMemo(() => {
    const clubsSet = new Set<string>();
    employees.forEach(emp => {
      if (emp.club) {
        clubsSet.add(emp.club);
      }
    });
    return Array.from(clubsSet).sort();
  }, [employees]);

  // Get departments available for selected club
  const availableDepartments = useMemo(() => {
    if (!selectedClub) return [];

    const depts = new Set<string>();
    employees.forEach(emp => {
      // Filter by the selected club
      if (emp.club === selectedClub && emp.department) {
        depts.add(emp.department);
      }
    });
    return Array.from(depts).sort();
  }, [employees, selectedClub]);

  // Filter employees by selected club and department
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Filter by selected club
    if (selectedClub) {
      filtered = filtered.filter(emp => emp.club === selectedClub);
    }

    // Filter by selected department
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    return filtered;
  }, [employees, selectedClub, selectedDepartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in to submit a nomination');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setSubmitting(true);

    try {
      // Find the selected employee details
      const employee = employees.find(e => e.id === selectedEmployee);

      if (!employee) {
        setErrorMessage('Selected employee not found');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        setSubmitting(false);
        return;
      }

      // Find the club ID from the selected club name
      // Match the club name from employees to the clubs table
      const club = clubs.find(c =>
        c.name.toLowerCase().includes(selectedClub.toLowerCase()) ||
        selectedClub.toLowerCase().includes(c.name.toLowerCase())
      );
      const clubId = club?.id || user.club_id;

      const { error } = await supabase.from('nominations').insert({
        club_id: clubId,
        nominator_id: user.id,
        nominee_id: employee.full_name, // Store employee name as nominee_id
        core_value_id: selectedValue,
        description: description.trim() || null, // NULL if empty
      });

      if (error) {
        console.error('Supabase error:', error);
        setErrorMessage(`Failed to submit nomination: ${error.message}`);
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        setSubmitting(false);
        return;
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);

      // Reset form
      setSelectedClub('');
      setSelectedDepartment('');
      setSelectedEmployee('');
      setSelectedValue('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting nomination:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset department and employee when club changes
  const handleClubChange = (clubId: string) => {
    setSelectedClub(clubId);
    setSelectedDepartment('');
    setSelectedEmployee('');
  };

  // Reset employee when department changes
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    setSelectedEmployee('');
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

        {/* Error Message */}
        {showError && (
          <div className="glass-strong rounded-2xl p-6 border-2 border-red-500/50 shadow-xl shadow-red-500/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">!</div>
              <div>
                <h3 className="font-semibold text-gray-900">Error</h3>
                <p className="text-gray-600 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nomination Form */}
        <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8 shadow-xl space-y-6">
          {/* Club Selection */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Select Club
            </label>
            <div className="relative">
              <select
                value={selectedClub}
                onChange={(e) => handleClubChange(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 text-gray-900 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Choose a club...</option>
                {availableClubs.map((clubName) => (
                  <option key={clubName} value={clubName}>
                    {clubName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Select Department
            </label>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 text-gray-900 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={!selectedClub}
              >
                <option value="">Choose a department...</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
            </div>
            {!selectedClub && (
              <p className="text-gray-500 text-xs mt-1">
                Please select a club first
              </p>
            )}
          </div>

          {/* Employee Selection */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Select Teammate
            </label>
            <div className="relative">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 text-gray-900 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                disabled={!selectedDepartment}
              >
                <option value="">Choose a teammate to nominate...</option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                    {employee.job_title ? ` - ${employee.job_title}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
            </div>
            {!selectedDepartment && (
              <p className="text-gray-500 text-xs mt-1">
                Please select a department first
              </p>
            )}
            {selectedDepartment && filteredEmployees.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">
                No employees found for this department
              </p>
            )}
          </div>

          {/* Core Value Selection */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Core Value
            </label>
            <div className="relative">
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 text-gray-900 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          {/* Description */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Why are you nominating this teammate?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how this teammate demonstrated this core value. Be specific about what they did and the impact it had..."
              rows={6}
              className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 text-gray-900 placeholder-emerald-600/70 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            <p className="text-gray-600/50 text-sm mt-2">
              Optional - Add details about why you're nominating this teammate
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 rounded-2xl text-gray-900 text-lg font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Nomination'}
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
