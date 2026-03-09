import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStudents } from '../services/studentService.js';
import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  updateAttendance,
} from '../services/attendanceService.js';
import { getStoredUser, isAuthenticated, logout } from '../services/authService.js';

function Attendance() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // filters for list
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');

  // form to mark attendance
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('present');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // edit modal
  const [editing, setEditing] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function loadStudents() {
    try {
      const data = await getStudents({ limit: 100 });
      const items = Array.isArray(data?.items) ? data.items : [];
      setStudents(items);
      if (!selectedStudentId && items.length > 0) {
        setSelectedStudentId(items[0]._id);
      }
    } catch (err) {
      // keep error minimal; main error shown from attendance load
      console.error('Failed to load students for attendance', err);
    }
  }

  async function refreshAttendance({ nextPage } = {}) {
    setLoading(true);
    setError('');
    try {
      const page = typeof nextPage === 'number' ? nextPage : pagination.page;
      const params = {
        page,
        limit: pagination.limit,
      };
      if (filterDate) params.date = filterDate;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterStudent !== 'all') params.student = filterStudent;

      const data = await getAttendance(params);
      setRecords(Array.isArray(data?.items) ? data.items : []);
      setPagination((p) => ({
        ...p,
        ...(data?.pagination || {}),
      }));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load attendance. Please try again.';
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
    Promise.all([loadStudents(), refreshAttendance()]).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
    refreshAttendance({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, filterStatus, filterStudent]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        id: s._id,
        label: `${s.name} (${s.enrollmentNumber})`,
      })),
    [students]
  );

  const cardClass =
    'border border-[#dadce0] rounded-2xl bg-white/80 shadow-sm hover:shadow-md transition-shadow';
  const inputClass =
    'w-full px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] placeholder:text-[#80868b] disabled:bg-gray-50 disabled:text-gray-500';
  const labelClass = 'block text-sm font-medium text-[#202124] mb-1';

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudentId) {
      setError('Please select a student.');
      return;
    }
    if (!course.trim()) {
      setError('Please enter course.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    setSubmitting(true);
    try {
      await createAttendance({
        student: selectedStudentId,
        course: course.trim(),
        date,
        status,
        note: note.trim() || undefined,
      });
      setSuccess('Attendance saved.');
      setNote('');
      await refreshAttendance({ nextPage: 1 });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to save attendance.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    setSuccess('');
    const ok = window.confirm('Delete this attendance record?');
    if (!ok) return;
    try {
      await deleteAttendance(id);
      setSuccess('Attendance record deleted.');
      const nextPage =
        pagination.page > 1 && records.length === 1
          ? pagination.page - 1
          : pagination.page;
      await refreshAttendance({ nextPage });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete attendance.';
      setError(message);
    }
  }

  function openEdit(record) {
    setEditing({
      _id: record._id,
      status: record.status,
      note: record.note || '',
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
    setEditSubmitting(true);
    try {
      await updateAttendance(editing._id, {
        status: editing.status,
        note: editing.note.trim() || undefined,
      });
      setSuccess('Attendance updated.');
      closeEdit();
      await refreshAttendance();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update attendance.';
      setError(message);
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[#dadce0] bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1a73e8] text-white flex items-center justify-center font-semibold shadow-sm">
              A
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#5f6368]">
                Student Management
              </div>
              <div className="text-base font-medium text-[#202124] leading-tight">
                Attendance
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
        {/* Mark attendance */}
        <section className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-medium text-[#202124]">
                Mark attendance
              </h1>
              <p className="mt-1 text-sm text-[#5f6368]">
                Select a student, date and status for the session.
              </p>
            </div>
            <button
              onClick={() => refreshAttendance()}
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
              <label className={labelClass} htmlFor="att-date">
                Date
              </label>
              <input
                id="att-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="att-student">
                Student
              </label>
              <select
                id="att-student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className={inputClass}
                disabled={submitting || students.length === 0}
              >
                {students.length === 0 && (
                  <option value="">No students available</option>
                )}
                {students.length > 0 &&
                  studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="att-course">
                Course
              </label>
              <input
                id="att-course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className={inputClass}
                placeholder="e.g. CS201 / Data Structures"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="att-status">
                Status
              </label>
              <select
                id="att-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
                disabled={submitting}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="att-note">
                Note (optional)
              </label>
              <textarea
                id="att-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="Any remarks about this session…"
                disabled={submitting}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-4 text-base font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
              >
                {submitting ? 'Saving…' : 'Save attendance'}
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
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass} htmlFor="filter-date">
                  Date
                </label>
                <input
                  id="filter-date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="filter-student">
                  Student
                </label>
                <select
                  id="filter-student"
                  value={filterStudent}
                  onChange={(e) => setFilterStudent(e.target.value)}
                  className={inputClass}
                >
                  <option value="all">All students</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="filter-status">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="all">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#5f6368]">
              {loading ? 'Loading…' : `${pagination.totalItems} records`}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="py-2 pr-3 font-medium">Course</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Note</th>
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
                {!loading && records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-[#5f6368]">
                      No attendance records found
                    </td>
                  </tr>
                )}
                {records.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-[#f1f3f4] last:border-b-0 hover:bg-[#f8f9fb] transition-colors"
                  >
                    <td className="py-2 pr-3 text-[#202124]">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3 text-[#202124]">
                      {r.student?.name || '—'}
                      <div className="text-xs text-[#5f6368]">
                        {r.student?.enrollmentNumber}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-[#202124]">{r.course}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                          r.status === 'present'
                            ? 'text-[#1e8e3e] border-green-200 bg-green-50'
                            : r.status === 'absent'
                              ? 'text-[#d93025] border-red-200 bg-red-50'
                              : 'text-[#b7791f] border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        {r.status === 'present'
                          ? 'Present'
                          : r.status === 'absent'
                            ? 'Absent'
                            : 'Late'}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-[#5f6368] max-w-xs truncate">
                      {r.note || '—'}
                    </td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="px-3 py-1.5 text-xs font-medium text-[#202124] hover:bg-[#f1f3f4] rounded-md border border-[#dadce0]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
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
                onClick={() => refreshAttendance({ nextPage: 1 })}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() =>
                  refreshAttendance({ nextPage: pagination.page - 1 })
                }
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  refreshAttendance({ nextPage: pagination.page + 1 })
                }
                disabled={loading || pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() =>
                  refreshAttendance({ nextPage: pagination.totalPages })
                }
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
          <div className="relative w-full max-w-[480px] bg-white border border-[#dadce0] rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-medium text-[#202124]">
                Edit attendance
              </h2>
              <button
                onClick={closeEdit}
                className="px-2 py-1 text-sm text-[#5f6368] hover:bg-[#f1f3f4] rounded-md"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={submitEdit}
              className="mt-4 space-y-4"
            >
              <div>
                <label className={labelClass} htmlFor="edit-status">
                  Status
                </label>
                <select
                  id="edit-status"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, status: e.target.value }))
                  }
                  className={inputClass}
                  disabled={editSubmitting}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-note">
                  Note
                </label>
                <textarea
                  id="edit-note"
                  value={editing.note}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, note: e.target.value }))
                  }
                  className={`${inputClass} min-h-[80px] resize-y`}
                  disabled={editSubmitting}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
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

export default Attendance;
