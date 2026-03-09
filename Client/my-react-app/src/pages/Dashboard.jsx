import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStudents } from '../services/studentService.js';
import { getDashboardSummary } from '../services/dashboardService.js';
import { getStoredUser, isAuthenticated, logout } from '../services/authService.js';

function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all'); // all | active | inactive

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    Promise.all([getDashboardSummary(), getStudents()])
      .then(([summaryData, studentsData]) => {
        if (cancelled) return;
        setSummary(summaryData || null);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      })
      .catch((err) => {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load dashboard data. Please try again.';
        if (!cancelled) setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const courses = useMemo(() => {
    const set = new Set();
    for (const s of students) {
      if (s?.course) set.add(s.course);
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (!s) return false;
      if (courseFilter !== 'all' && s.course !== courseFilter) return false;
      if (activeFilter === 'active' && s.isActive !== true) return false;
      if (activeFilter === 'inactive' && s.isActive !== false) return false;

      if (!q) return true;
      const haystack = `${s.name || ''} ${s.email || ''} ${s.enrollmentNumber || ''} ${s.course || ''} ${s.year || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [students, query, courseFilter, activeFilter]);

  const totals = useMemo(() => {
    const totalFromApi = summary?.totals?.students ?? null;
    const activeFromApi = summary?.totals?.activeStudents ?? null;

    const total =
      typeof totalFromApi === 'number' ? totalFromApi : students.length;
    const active =
      typeof activeFromApi === 'number'
        ? activeFromApi
        : students.filter((s) => s && s.isActive !== false).length;
    const inactive = Math.max(total - active, 0);

    return { total, active, inactive };
  }, [summary, students]);

  const studentsByCourse = useMemo(() => {
    if (Array.isArray(summary?.studentsByCourse) && summary.studentsByCourse.length > 0) {
      return summary.studentsByCourse;
    }

    const map = new Map();
    for (const s of students) {
      const key = s?.course || 'Unknown';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count || a.course.localeCompare(b.course));
  }, [summary, students]);

  const recentStudents = useMemo(() => {
    if (Array.isArray(summary?.recentStudents) && summary.recentStudents.length > 0) {
      return summary.recentStudents;
    }
    return [...students].slice(0, 5);
  }, [summary, students]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const cardClass =
    'border border-[#dadce0] rounded-2xl bg-white/80 shadow-sm hover:shadow-md transition-shadow p-5';

  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[#dadce0] bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1a73e8] text-white flex items-center justify-center font-semibold shadow-sm">
              S
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#5f6368]">
                Student Management
              </div>
              <div className="text-base font-medium text-[#202124] leading-tight">
                Overview
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-[#5f6368]">
              {user?.name ? `Signed in as ${user.name}` : 'Signed in'}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={cardClass}>
            <div className="text-sm text-[#5f6368]">Total students</div>
            <div className="mt-2 text-3xl font-semibold text-[#202124]">
              {loading ? '—' : totals.total}
            </div>
          </div>
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#5f6368]">Active students</div>
              <span className="inline-flex items-center rounded-full bg-green-50 text-[#1e8e3e] px-2 py-0.5 text-xs font-medium border border-green-200">
                Active
              </span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#202124]">
              {loading ? '—' : totals.active}
            </div>
          </div>
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#5f6368]">Inactive students</div>
              <span className="inline-flex items-center rounded-full bg-red-50 text-[#d93025] px-2 py-0.5 text-xs font-medium border border-red-200">
                Inactive
              </span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-[#202124]">
              {loading ? '—' : totals.inactive}
            </div>
          </div>
        </div>

        {/* Quick navigation */}
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            to="/students"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1a73e8] border border-[#dadce0] rounded-full hover:bg-[#e8f0fe] bg-white/80"
          >
            <span className="text-base">👤</span>
            <span>Manage students</span>
          </Link>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1a73e8] border border-[#dadce0] rounded-full hover:bg-[#e8f0fe] bg-white/80"
          >
            <span className="text-base">📚</span>
            <span>Courses</span>
          </Link>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1a73e8] border border-[#dadce0] rounded-full hover:bg-[#e8f0fe] bg-white/80"
          >
            <span className="text-base">🗓️</span>
            <span>Attendance</span>
          </Link>
          <Link
            to="/grades"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1a73e8] border border-[#dadce0] rounded-full hover:bg-[#e8f0fe] bg-white/80"
          >
            <span className="text-base">📊</span>
            <span>Grades</span>
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1a73e8] border border-[#dadce0] rounded-full hover:bg-[#e8f0fe] bg-white/80"
          >
            <span className="text-base">📄</span>
            <span>Reports</span>
          </Link>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#202124] mb-1">
              Search students
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, enrollment, course…"
              className="w-full px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] placeholder:text-[#80868b]"
            />
          </div>
          <div className="flex gap-3">
            <div>
              <label className="block text-sm font-medium text-[#202124] mb-1">
                Course
              </label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="min-w-[180px] px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
              >
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All courses' : c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#202124] mb-1">
                Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="min-w-[160px] px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error / loading */}
        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 text-[#d93025] rounded-md px-4 py-3">
            {error}
          </div>
        )}

        {/* Two tables */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-[#202124]">
                Students by course
              </h2>
              <span className="text-sm text-[#5f6368]">
                {loading ? 'Loading…' : `${studentsByCourse.length} courses`}
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
                    <th className="py-2 pr-3 font-medium">Course</th>
                    <th className="py-2 font-medium">Students</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && studentsByCourse.length === 0 && (
                    <tr>
                      <td className="py-3 text-[#5f6368]" colSpan={2}>
                        No data
                      </td>
                    </tr>
                  )}
                  {studentsByCourse.map((row) => (
                    <tr
                      key={row.course}
                      className="border-b border-[#f1f3f4] last:border-b-0"
                    >
                      <td className="py-2 pr-3 text-[#202124]">
                        {row.course}
                      </td>
                      <td className="py-2 text-[#202124]">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-[#202124]">
                Recent students
              </h2>
              <Link
                to="/students"
                className="text-sm font-medium text-[#1a73e8] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 font-medium">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td className="py-3 text-[#5f6368]" colSpan={3}>
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && recentStudents.length === 0 && (
                    <tr>
                      <td className="py-3 text-[#5f6368]" colSpan={3}>
                        No students found
                      </td>
                    </tr>
                  )}
                  {recentStudents.map((s) => (
                    <tr
                      key={s._id}
                      className="border-b border-[#f1f3f4] last:border-b-0"
                    >
                      <td className="py-2 pr-3 text-[#202124]">{s.name}</td>
                      <td className="py-2 pr-3 text-[#5f6368]">{s.email}</td>
                      <td className="py-2 text-[#202124]">{s.course}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Interactive preview list */}
        <div className={`mt-6 ${cardClass}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-[#202124]">
              Student list (filtered)
            </h2>
            <span className="text-sm text-[#5f6368]">
              {loading ? '—' : `${filteredStudents.length} shown`}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Enrollment</th>
                  <th className="py-2 pr-3 font-medium">Course</th>
                  <th className="py-2 pr-3 font-medium">Year</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredStudents.length === 0 && (
                  <tr>
                    <td className="py-3 text-[#5f6368]" colSpan={5}>
                      No matching students
                    </td>
                  </tr>
                )}
                {filteredStudents.slice(0, 10).map((s) => (
                  <tr
                    key={s._id}
                    className="border-b border-[#f1f3f4] last:border-b-0"
                  >
                    <td className="py-2 pr-3 text-[#202124]">{s.name}</td>
                    <td className="py-2 pr-3 text-[#5f6368]">
                      {s.enrollmentNumber}
                    </td>
                    <td className="py-2 pr-3 text-[#202124]">{s.course}</td>
                    <td className="py-2 pr-3 text-[#202124]">{s.year}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                          s.isActive
                            ? 'text-[#1e8e3e] border-green-200 bg-green-50'
                            : 'text-[#d93025] border-red-200 bg-red-50'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredStudents.length > 10 && (
              <div className="mt-3 text-sm text-[#5f6368]">
                Showing first 10 results. Go to{' '}
                <Link to="/students" className="text-[#1a73e8] hover:underline">
                  Students
                </Link>{' '}
                for full list.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
