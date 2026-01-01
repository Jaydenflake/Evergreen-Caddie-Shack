import { useEffect, useState, useMemo } from 'react';
import { Award, ChevronLeft, ChevronRight, Users, TrendingUp, Building2, X, Calendar, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Nomination, Club, Employee, CoreValue, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface EmployeeNomination {
  employee_name: string;
  nomination_count: number;
  department?: string;
  job_title?: string;
}

const ITEMS_PER_PAGE = 25;

export default function AdminNominations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    if (user && !user.is_admin) {
      navigate('/');
      return;
    }

    fetchNominations();
  }, [user, navigate]);

  const fetchNominations = async () => {
    try {
      console.log('Fetching nominations as admin user:', user?.full_name, 'is_admin:', user?.is_admin);

      const [nominationsRes, clubsRes, employeesRes, coreValuesRes, profilesRes] = await Promise.all([
        supabase.from('nominations').select('*').order('created_at', { ascending: false }),
        supabase.from('clubs').select('*').order('name'),
        supabase.from('employees').select('*'),
        supabase.from('core_values').select('*'),
        supabase.from('profiles').select('*'),
      ]);

      console.log('Nominations query result:', { data: nominationsRes.data, error: nominationsRes.error, count: nominationsRes.data?.length });

      if (nominationsRes.error) {
        console.error('Error fetching nominations:', nominationsRes.error);
        return;
      }

      if (clubsRes.error) {
        console.error('Error fetching clubs:', clubsRes.error);
      }

      if (employeesRes.error) {
        console.error('Error fetching employees:', employeesRes.error);
      }

      if (coreValuesRes.error) {
        console.error('Error fetching core values:', coreValuesRes.error);
      }

      if (profilesRes.error) {
        console.error('Error fetching profiles:', profilesRes.error);
      }

      if (nominationsRes.data) {
        setNominations(nominationsRes.data);
      }

      if (clubsRes.data) {
        setClubs(clubsRes.data);
      }

      if (employeesRes.data) {
        setEmployees(employeesRes.data);
      }

      if (coreValuesRes.data) {
        setCoreValues(coreValuesRes.data);
        console.log('Core values:', coreValuesRes.data);
      }

      if (profilesRes.data) {
        setProfiles(profilesRes.data);
        console.log('Profiles:', profilesRes.data);
      }

      // Debug: Check nomination structure
      if (nominationsRes.data && nominationsRes.data.length > 0) {
        console.log('Sample nomination:', nominationsRes.data[0]);
        console.log('Nomination core_value_id:', nominationsRes.data[0].core_value_id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter nominations based on selected club
  const filteredNominations = useMemo(() => {
    if (selectedClubFilter === 'all') {
      return nominations;
    }
    return nominations.filter(nom => nom.club_id === selectedClubFilter);
  }, [nominations, selectedClubFilter]);

  // Calculate employee stats from filtered nominations
  const calculateEmployeeStats = (nominations: Nomination[]) => {
    const counts: { [key: string]: number } = {};

    nominations.forEach((nom) => {
      const name = nom.nominee_id;
      counts[name] = (counts[name] || 0) + 1;
    });

    const stats: EmployeeNomination[] = Object.entries(counts).map(([name, count]) => {
      const employee = employees.find(emp => emp.full_name === name);
      return {
        employee_name: name,
        nomination_count: count,
        department: employee?.department || 'N/A',
        job_title: employee?.job_title || 'N/A',
      };
    });

    stats.sort((a, b) => {
      if (b.nomination_count !== a.nomination_count) {
        return b.nomination_count - a.nomination_count;
      }
      return a.employee_name.localeCompare(b.employee_name);
    });

    return stats;
  };

  // Calculate stats for current filtered view
  const employeeStats = useMemo(() => calculateEmployeeStats(filteredNominations), [filteredNominations, employees]);

  // Calculate club with most nominations
  const clubWithMostNominations = useMemo(() => {
    const clubCounts: { [key: string]: number } = {};
    nominations.forEach(nom => {
      clubCounts[nom.club_id] = (clubCounts[nom.club_id] || 0) + 1;
    });

    let maxClubId = '';
    let maxCount = 0;
    Object.entries(clubCounts).forEach(([clubId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxClubId = clubId;
      }
    });

    const club = clubs.find(c => c.id === maxClubId);
    return { name: club?.name || 'N/A', count: maxCount };
  }, [nominations, clubs]);

  // Pagination calculations
  const totalPages = Math.ceil(employeeStats.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEmployees = employeeStats.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, and pages around current
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  // Get nominations for selected employee
  const employeeNominations = useMemo(() => {
    if (!selectedEmployee) return [];
    return filteredNominations
      .filter(nom => nom.nominee_id === selectedEmployee)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedEmployee, filteredNominations]);

  // Get nominator profile for a nomination
  const getNominatorProfile = (nominatorId: string) => {
    return profiles.find(p => p.id === nominatorId);
  };

  // Get core value for a nomination
  const getCoreValue = (valueId: string) => {
    return coreValues.find(cv => cv.id === valueId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
                <Award className="w-8 h-8 text-emerald-400" />
                Nominations
              </h1>
              <p className="text-gray-600">
                View all employee nominations and statistics across all clubs
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-600">{filteredNominations.length}</div>
              <div className="text-sm text-gray-600">
                {selectedClubFilter === 'all' ? 'Total Nominations' : 'Filtered Nominations'}
              </div>
            </div>
          </div>
        </div>

        {/* Club Filter */}
        <div className="glass-strong rounded-2xl p-6 shadow-xl">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Filter by Club
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedClubFilter('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedClubFilter === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              All Clubs
            </button>
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => {
                  setSelectedClubFilter(club.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedClubFilter === club.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {club.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-strong rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-gray-900">Employees Nominated</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{employeeStats.length}</div>
          </div>

          <div className="glass-strong rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-gray-900">Top Nominee</h3>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {employeeStats[0]?.employee_name || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              {employeeStats[0]?.nomination_count || 0} nominations
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-gray-900">Club with Most Nominations</h3>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {clubWithMostNominations.name}
            </div>
            <div className="text-sm text-gray-600">
              {clubWithMostNominations.count} nominations
            </div>
          </div>
        </div>

        {/* Employee Nominations Table */}
        <div className="glass-strong rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Employee Nominations</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading nominations...</p>
            </div>
          ) : currentEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No nominations yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-emerald-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Job Title</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Nominations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEmployees.map((employee) => {
                      return (
                        <tr
                          key={employee.employee_name}
                          onClick={() => setSelectedEmployee(employee.employee_name)}
                          className="border-b border-emerald-100 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{employee.employee_name}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-700">{employee.department}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-700">{employee.job_title}</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-2 bg-emerald-100 px-3 py-1 rounded-full">
                              <Award className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-700">
                                {employee.nomination_count}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, employeeStats.length)} of{' '}
                    {employeeStats.length} employees
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' && goToPage(page)}
                          disabled={page === '...'}
                          className={`min-w-[2.5rem] h-10 rounded-lg font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                              : page === '...'
                              ? 'text-gray-400 cursor-default'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Employee Nominations Detail Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{selectedEmployee}</h2>
                  <p className="text-gray-600 mt-2 text-lg">{employeeNominations.length} nomination{employeeNominations.length !== 1 ? 's' : ''} received</p>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                >
                  <X className="w-7 h-7 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {employeeNominations.map((nomination) => {
                    const nominator = getNominatorProfile(nomination.nominator_id);
                    const coreValue = getCoreValue(nomination.core_value_id);
                    const truncatedDescription = nomination.description && nomination.description.length > 120
                      ? nomination.description.substring(0, 120) + '...'
                      : nomination.description;

                    return (
                      <div
                        key={nomination.id}
                        className="bg-white rounded-xl p-6 shadow-md border border-emerald-100 hover:shadow-lg transition-all"
                      >
                        {/* Header with Core Value and Date */}
                        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">{coreValue?.name || 'Unknown Value'}</div>
                              <div className="text-sm text-gray-600">{coreValue?.tagline}</div>
                            </div>
                          </div>
                        </div>

                        {/* Nominator and Date */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <UserIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-gray-700">
                              Nominated by <span className="font-semibold text-gray-900">{nominator?.full_name || 'Unknown'}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(nomination.created_at)}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[80px]">
                          <p className="text-gray-700 text-sm leading-relaxed break-words">{truncatedDescription}</p>
                        </div>

                        {/* See Description Button */}
                        {nomination.description && nomination.description.length > 120 && (
                          <button
                            onClick={() => setSelectedDescription(nomination.description || '')}
                            className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:shadow-md transition-all text-sm"
                          >
                            See Full Description
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {employeeNominations.length === 0 && (
                    <div className="col-span-2 text-center py-12">
                      <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No nominations found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description Detail Modal */}
        {selectedDescription && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-6">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
                <h2 className="text-3xl font-bold text-gray-900">Nomination Description</h2>
                <button
                  onClick={() => setSelectedDescription(null)}
                  className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                >
                  <X className="w-7 h-7 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-10 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-4xl mx-auto">
                  <p className="text-gray-800 leading-relaxed text-xl whitespace-pre-wrap break-words">
                    {selectedDescription}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSelectedDescription(null)}
                  className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
