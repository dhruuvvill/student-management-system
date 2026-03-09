import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
} from '../services/studentService.js';
import { getStoredUser, isAuthenticated, logout } from '../services/authService.js';

function Students() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters
  const [query, setQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive

  // form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // edit modal
  const [editing, setEditing] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function refreshStudents({ nextPage } = {}) {
    setLoading(true);
    setError('');
    try {
      const page = typeof nextPage === 'number' ? nextPage : pagination.page;
      const params = {
        page,
        limit: pagination.limit,
      };
      if (query.trim()) params.q = query.trim();
      if (courseFilter !== 'all') params.course = courseFilter;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;

      const data = await getStudents(params);
      setStudents(Array.isArray(data?.items) ? data.items : []);
      setPagination((p) => ({
        ...p,
        ...(data?.pagination || {}),
      }));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load students. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
    refreshStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
    refreshStudents({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, courseFilter, statusFilter]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const courses = useMemo(() => {
    const set = new Set();
    for (const s of students) if (s?.course) set.add(s.course);
    // include current selected course even if not in current page
    if (courseFilter !== 'all') set.add(courseFilter);
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [students, courseFilter]);

  // With server-side search/pagination, list is already filtered.
  const visibleStudents = students;

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !enrollmentNumber.trim() || !course.trim()) {
      setError('Please fill: name, email, enrollment number, and course.');
      return;
    }

    const yearNum = Number(year);
    if (!Number.isFinite(yearNum) || yearNum < 1 || yearNum > 5) {
      setError('Year must be a number between 1 and 5.');
      return;
    }

    setSubmitting(true);
    try {
      await createStudent({
        name: name.trim(),
        email: email.trim(),
        enrollmentNumber: enrollmentNumber.trim(),
        course: course.trim(),
        year: yearNum,
        isActive,
      });
      setSuccess('Student added successfully.');
      setName('');
      setEmail('');
      setEnrollmentNumber('');
      setCourse('');
      setYear('1');
      setIsActive(true);
      await refreshStudents({ nextPage: 1 });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to add student.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    setSuccess('');
    const ok = window.confirm('Delete this student?');
    if (!ok) return;
    try {
      await deleteStudent(id);
      setSuccess('Student deleted.');
      const nextPage =
        pagination.page > 1 && visibleStudents.length === 1
          ? pagination.page - 1
          : pagination.page;
      await refreshStudents({ nextPage });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete student.';
      setError(message);
    }
  }

  async function handleToggleActive(student) {
    setError('');
    setSuccess('');
    try {
      await updateStudent(student._id, { isActive: !student.isActive });
      setSuccess('Status updated.');
      await refreshStudents();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update status.';
      setError(message);
    }
  }

  function openEdit(student) {
    setEditing({
      _id: student._id,
      name: student.name || '',
      email: student.email || '',
      enrollmentNumber: student.enrollmentNumber || '',
      course: student.course || '',
      year: String(student.year ?? 1),
      isActive: student.isActive !== false,
    });
  }

  function closeEdit() {
    setEditing(null);
    setEditSubmitting(false);
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    setSuccess('');

    if (!editing.name.trim() || !editing.email.trim() || !editing.enrollmentNumber.trim() || !editing.course.trim()) {
      setError('Please fill: name, email, enrollment number, and course.');
      return;
    }

    const yearNum = Number(editing.year);
    if (!Number.isFinite(yearNum) || yearNum < 1 || yearNum > 5) {
      setError('Year must be a number between 1 and 5.');
      return;
    }

    setEditSubmitting(true);
    try {
      await updateStudent(editing._id, {
        name: editing.name.trim(),
        email: editing.email.trim(),
        enrollmentNumber: editing.enrollmentNumber.trim(),
        course: editing.course.trim(),
        year: yearNum,
        isActive: editing.isActive,
      });
      setSuccess('Student updated.');
      closeEdit();
      await refreshStudents();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update student.';
      setError(message);
    } finally {
      setEditSubmitting(false);
    }
  }

  const cardClass =
    'border border-[#dadce0] rounded-2xl bg-white/80 shadow-sm hover:shadow-md transition-shadow';
  const inputClass =
    'w-full px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] placeholder:text-[#80868b] disabled:bg-gray-50 disabled:text-gray-500';
  const labelClass = 'block text-sm font-medium text-[#202124] mb-1';

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
                Students
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
            >
              Dashboard
            </Link>
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
        {/* Add student */}
        <section className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-medium text-[#202124]">Add student</h1>
              <p className="mt-1 text-sm text-[#5f6368]">
                Quickly add a new student to the system.
              </p>
            </div>
            <button
              onClick={refreshStudents}
              className="px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="name">Name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Student name" disabled={submitting} />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="student@example.com" disabled={submitting} />
            </div>
            <div>
              <label className={labelClass} htmlFor="enroll">Enrollment number</label>
              <input id="enroll" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} className={inputClass} placeholder="ENR-0001" disabled={submitting} />
            </div>
            <div>
              <label className={labelClass} htmlFor="course">Course</label>
              <input id="course" value={course} onChange={(e) => setCourse(e.target.value)} className={inputClass} placeholder="BCA / BTech / MBA ..." disabled={submitting} />
            </div>
            <div>
              <label className={labelClass} htmlFor="year">Year</label>
              <select id="year" value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} disabled={submitting}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="active">Status</label>
              <select
                id="active"
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className={inputClass}
                disabled={submitting}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-4 text-base font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
              >
                {submitting ? 'Saving…' : 'Add student'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 text-sm text-[#d93025] bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 text-sm text-[#1e8e3e] bg-green-50 border border-green-200 rounded-md px-3 py-2">
              {success}
            </div>
          )}
        </section>

        {/* Filters + list */}
        <section className={`${cardClass} p-6`}>
          <div className="flex flex-col md:flex-row md:items-end gap-3 md:justify-between">
            <div className="flex-1">
              <label className={labelClass}>Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={inputClass}
                placeholder="Search by name, email, enrollment, course…"
              />
            </div>
            <div className="flex gap-3">
              <div>
                <label className={labelClass}>Course</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className={`${inputClass} min-w-[180px]`}
                >
                  {courses.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? 'All courses' : c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${inputClass} min-w-[160px]`}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#5f6368]">
              {loading ? 'Loading…' : `${pagination.totalItems} students`}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Enrollment</th>
                  <th className="py-2 pr-3 font-medium">Course</th>
                  <th className="py-2 pr-3 font-medium">Year</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-[#5f6368]">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && visibleStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-[#5f6368]">
                      No students found
                    </td>
                  </tr>
                )}
                {visibleStudents.map((s) => (
                  <tr
                    key={s._id}
                    className="border-b border-[#f1f3f4] last:border-b-0 hover:bg-[#f8f9fb] transition-colors"
                  >
                    <td className="py-2 pr-3 text-[#202124]">{s.name}</td>
                    <td className="py-2 pr-3 text-[#5f6368]">{s.email}</td>
                    <td className="py-2 pr-3 text-[#5f6368]">{s.enrollmentNumber}</td>
                    <td className="py-2 pr-3 text-[#202124]">{s.course}</td>
                    <td className="py-2 pr-3 text-[#202124]">{s.year}</td>
                    <td className="py-2 pr-3">
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
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="px-3 py-1.5 text-xs font-medium text-[#202124] hover:bg-[#f1f3f4] rounded-md border border-[#dadce0]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(s)}
                          className="px-3 py-1.5 text-xs font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="px-3 py-1.5 text-xs font-medium text-[#d93025] hover:bg-red-50 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-[#5f6368]">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshStudents({ nextPage: 1 })}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => refreshStudents({ nextPage: pagination.page - 1 })}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => refreshStudents({ nextPage: pagination.page + 1 })}
                disabled={loading || pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => refreshStudents({ nextPage: pagination.totalPages })}
                disabled={loading || pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeEdit}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-[520px] bg-white border border-[#dadce0] rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-medium text-[#202124]">Edit student</h2>
              <button
                onClick={closeEdit}
                className="px-2 py-1 text-sm text-[#5f6368] hover:bg-[#f1f3f4] rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitEdit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="edit-name">Name</label>
                <input
                  id="edit-name"
                  value={editing.name}
                  onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
                  className={inputClass}
                  disabled={editSubmitting}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))}
                  className={inputClass}
                  disabled={editSubmitting}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-enroll">Enrollment</label>
                <input
                  id="edit-enroll"
                  value={editing.enrollmentNumber}
                  onChange={(e) => setEditing((s) => ({ ...s, enrollmentNumber: e.target.value }))}
                  className={inputClass}
                  disabled={editSubmitting}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-course">Course</label>
                <input
                  id="edit-course"
                  value={editing.course}
                  onChange={(e) => setEditing((s) => ({ ...s, course: e.target.value }))}
                  className={inputClass}
                  disabled={editSubmitting}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-year">Year</label>
                <select
                  id="edit-year"
                  value={editing.year}
                  onChange={(e) => setEditing((s) => ({ ...s, year: e.target.value }))}
                  className={inputClass}
                  disabled={editSubmitting}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={editing.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditing((s) => ({ ...s, isActive: e.target.value === 'active' }))}
                  className={inputClass}
                  disabled={editSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2.5 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4]"
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {editSubmitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
