import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from '../services/courseService.js';
import { getStoredUser, isAuthenticated, logout } from '../services/authService.js';

function Courses() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [courses, setCourses] = useState([]);
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
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive

  // form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [credits, setCredits] = useState('3');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // edit modal
  const [editing, setEditing] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function refreshCourses({ nextPage } = {}) {
    setLoading(true);
    setError('');
    try {
      const page = typeof nextPage === 'number' ? nextPage : pagination.page;
      const params = {
        page,
        limit: pagination.limit,
      };
      if (query.trim()) params.q = query.trim();
      if (departmentFilter !== 'all') params.department = departmentFilter;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'inactive') params.isActive = false;

      const data = await getCourses(params);
      setCourses(Array.isArray(data?.items) ? data.items : []);
      setPagination((p) => ({
        ...p,
        ...(data?.pagination || {}),
      }));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load courses. Please try again.';
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
    refreshCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
    refreshCourses({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, departmentFilter, statusFilter]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const departments = useMemo(() => {
    const set = new Set();
    for (const c of courses) if (c?.department) set.add(c.department);
    if (departmentFilter !== 'all') set.add(departmentFilter);
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [courses, departmentFilter]);

  const visibleCourses = courses;

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !code.trim() || !department.trim()) {
      setError('Please fill: name, code, and department.');
      return;
    }

    const creditsNum = Number(credits);
    if (!Number.isFinite(creditsNum) || creditsNum < 1 || creditsNum > 10) {
      setError('Credits must be between 1 and 10.');
      return;
    }

    setSubmitting(true);
    try {
      await createCourse({
        name: name.trim(),
        code: code.trim(),
        department: department.trim(),
        credits: creditsNum,
        isActive,
      });
      setSuccess('Course added successfully.');
      setName('');
      setCode('');
      setDepartment('');
      setCredits('3');
      setIsActive(true);
      await refreshCourses({ nextPage: 1 });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to add course.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    setSuccess('');
    const ok = window.confirm('Delete this course?');
    if (!ok) return;
    try {
      await deleteCourse(id);
      setSuccess('Course deleted.');
      const nextPage =
        pagination.page > 1 && visibleCourses.length === 1
          ? pagination.page - 1
          : pagination.page;
      await refreshCourses({ nextPage });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete course.';
      setError(message);
    }
  }

  async function handleToggleActive(course) {
    setError('');
    setSuccess('');
    try {
      await updateCourse(course._id, { isActive: !course.isActive });
      setSuccess('Status updated.');
      await refreshCourses();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update status.';
      setError(message);
    }
  }

  function openEdit(course) {
    setEditing({
      _id: course._id,
      name: course.name || '',
      code: course.code || '',
      department: course.department || '',
      credits: String(course.credits ?? 3),
      isActive: course.isActive !== false,
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

    if (!editing.name.trim() || !editing.code.trim() || !editing.department.trim()) {
      setError('Please fill: name, code, and department.');
      return;
    }

    const creditsNum = Number(editing.credits);
    if (!Number.isFinite(creditsNum) || creditsNum < 1 || creditsNum > 10) {
      setError('Credits must be between 1 and 10.');
      return;
    }

    setEditSubmitting(true);
    try {
      await updateCourse(editing._id, {
        name: editing.name.trim(),
        code: editing.code.trim(),
        department: editing.department.trim(),
        credits: creditsNum,
        isActive: editing.isActive,
      });
      setSuccess('Course updated.');
      closeEdit();
      await refreshCourses();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update course.';
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
              C
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#5f6368]">
                Student Management
              </div>
              <div className="text-base font-medium text-[#202124] leading-tight">
                Courses
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
        {/* Add course */}
        <section className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-medium text-[#202124]">Add course</h1>
              <p className="mt-1 text-sm text-[#5f6368]">
                Define courses students can enroll in.
              </p>
            </div>
            <button
              onClick={refreshCourses}
              className="px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <form
            onSubmit={handleCreate}
            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className={labelClass} htmlFor="name">
                Course name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Data Structures"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="code">
                Code
              </label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="e.g. CS201"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="department">
                Department
              </label>
              <input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClass}
                placeholder="e.g. Computer Science"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="credits">
                Credits
              </label>
              <select
                id="credits"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className={inputClass}
                disabled={submitting}
              >
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="course-status">
                Status
              </label>
              <select
                id="course-status"
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
                {submitting ? 'Saving…' : 'Add course'}
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
                placeholder="Search by name, code, department…"
              />
            </div>
            <div className="flex gap-3">
              <div>
                <label className={labelClass}>Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className={`${inputClass} min-w-[180px]`}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d === 'all' ? 'All departments' : d}
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
              {loading ? 'Loading…' : `${pagination.totalItems} courses`}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Code</th>
                  <th className="py-2 pr-3 font-medium">Department</th>
                  <th className="py-2 pr-3 font-medium">Credits</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-[#5f6368]">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && visibleCourses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-[#5f6368]">
                      No courses found
                    </td>
                  </tr>
                )}
                {visibleCourses.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-[#f1f3f4] last:border-b-0 hover:bg-[#f8f9fb] transition-colors"
                  >
                    <td className="py-2 pr-3 text-[#202124]">{c.name}</td>
                    <td className="py-2 pr-3 text-[#202124]">{c.code}</td>
                    <td className="py-2 pr-3 text-[#202124]">{c.department}</td>
                    <td className="py-2 pr-3 text-[#202124]">{c.credits}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                          c.isActive
                            ? 'text-[#1e8e3e] border-green-200 bg-green-50'
                            : 'text-[#d93025] border-red-200 bg-red-50'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-1.5 text-xs font-medium text-[#202124] hover:bg-[#f1f3f4] rounded-md border border-[#dadce0]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(c)}
                          className="px-3 py-1.5 text-xs font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
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
                onClick={() => refreshCourses({ nextPage: 1 })}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => refreshCourses({ nextPage: pagination.page - 1 })}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => refreshCourses({ nextPage: pagination.page + 1 })}
                disabled={loading || pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => refreshCourses({ nextPage: pagination.totalPages })}
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
              <h2 className="text-lg font-medium text-[#202124]">Edit course</h2>
              <button
                onClick={closeEdit}
                className="px-2 py-1 text-sm text-[#5f6368] hover:bg-[#f1f3f4] rounded-md"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={submitEdit}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className={labelClass} htmlFor="edit-name">
                  Course name
                </label>
                <input
                  id="edit-name"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, name: e.target.value }))
                  }
                  className={inputClass}
                  disabled={editSubmitting}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-code">
                  Code
                </label>
                <input
                  id="edit-code"
                  value={editing.code}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, code: e.target.value.toUpperCase() }))
                  }
                  className={inputClass}
                  disabled={editSubmitting}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-dept">
                  Department
                </label>
                <input
                  id="edit-dept"
                  value={editing.department}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, department: e.target.value }))
                  }
                  className={inputClass}
                  disabled={editSubmitting}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-credits">
                  Credits
                </label>
                <select
                  id="edit-credits"
                  value={editing.credits}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, credits: e.target.value }))
                  }
                  className={inputClass}
                  disabled={editSubmitting}
                >
                  {[1, 2, 3, 4, 5, 6].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-status">
                  Status
                </label>
                <select
                  id="edit-status"
                  value={editing.isActive ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setEditing((s) => ({
                      ...s,
                      isActive: e.target.value === 'active',
                    }))
                  }
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

export default Courses;
