import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStudents } from '../services/studentService.js';
import {
  createGrade,
  deleteGrade,
  getGrades,
  updateGrade,
} from '../services/gradeService.js';
import { getStoredUser, isAuthenticated, logout } from '../services/authService.js';

function Grades() {
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

  // filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterExam, setFilterExam] = useState('');

  // form to add grade
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [exam, setExam] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [grade, setGrade] = useState('');
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
      console.error('Failed to load students for grades', err);
    }
  }

  async function refreshGrades({ nextPage } = {}) {
    setLoading(true);
    setError('');
    try {
      const page = typeof nextPage === 'number' ? nextPage : pagination.page;
      const params = {
        page,
        limit: pagination.limit,
      };
      if (filterDate) params.date = filterDate;
      if (filterStudent !== 'all') params.student = filterStudent;
      if (filterCourse.trim()) params.course = filterCourse.trim();
      if (filterExam.trim()) params.exam = filterExam.trim();

      const data = await getGrades(params);
      setRecords(Array.isArray(data?.items) ? data.items : []);
      setPagination((p) => ({
        ...p,
        ...(data?.pagination || {}),
      }));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load grades. Please try again.';
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
    Promise.all([loadStudents(), refreshGrades()]).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
    refreshGrades({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, filterStudent, filterCourse, filterExam]);

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

  function computeGradeLetter(scoreNum, maxNum) {
    if (!Number.isFinite(scoreNum) || !Number.isFinite(maxNum) || maxNum <= 0) {
      return '';
    }
    const pct = (scoreNum / maxNum) * 100;
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  }

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
    if (!exam.trim()) {
      setError('Please enter exam name.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    const scoreNum = Number(score);
    const maxNum = Number(maxScore);
    if (!Number.isFinite(scoreNum) || scoreNum < 0) {
      setError('Score must be a non-negative number.');
      return;
    }
    if (!Number.isFinite(maxNum) || maxNum <= 0) {
      setError('Max score must be a positive number.');
      return;
    }
    if (scoreNum > maxNum) {
      setError('Score cannot be greater than max score.');
      return;
    }

    const gradeLetter = grade.trim() || computeGradeLetter(scoreNum, maxNum);

    setSubmitting(true);
    try {
      await createGrade({
        student: selectedStudentId,
        course: course.trim(),
        exam: exam.trim(),
        date,
        score: scoreNum,
        maxScore: maxNum,
        grade: gradeLetter || undefined,
        note: note.trim() || undefined,
      });
      setSuccess('Grade saved.');
      setScore('');
      setGrade('');
      setNote('');
      await refreshGrades({ nextPage: 1 });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to save grade.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    setSuccess('');
    const ok = window.confirm('Delete this grade record?');
    if (!ok) return;
    try {
      await deleteGrade(id);
      setSuccess('Grade record deleted.');
      const nextPage =
        pagination.page > 1 && records.length === 1
          ? pagination.page - 1
          : pagination.page;
      await refreshGrades({ nextPage });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete grade.';
      setError(message);
    }
  }

  function openEdit(record) {
    setEditing({
      _id: record._id,
      score: String(record.score),
      maxScore: String(record.maxScore),
      grade: record.grade || '',
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

    const scoreNum = Number(editing.score);
    const maxNum = Number(editing.maxScore);
    if (!Number.isFinite(scoreNum) || scoreNum < 0) {
      setError('Score must be a non-negative number.');
      return;
    }
    if (!Number.isFinite(maxNum) || maxNum <= 0) {
      setError('Max score must be a positive number.');
      return;
    }
    if (scoreNum > maxNum) {
      setError('Score cannot be greater than max score.');
      return;
    }

    const gradeLetter =
      editing.grade.trim() || computeGradeLetter(scoreNum, maxNum);

    setEditSubmitting(true);
    try {
      await updateGrade(editing._id, {
        score: scoreNum,
        maxScore: maxNum,
        grade: gradeLetter || undefined,
        note: editing.note.trim() || undefined,
      });
      setSuccess('Grade updated.');
      closeEdit();
      await refreshGrades();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update grade.';
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
              G
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[#5f6368]">
                Student Management
              </div>
              <div className="text-base font-medium text-[#202124] leading-tight">
                Grades
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
        {/* Add grade */}
        <section className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-medium text-[#202124]">Add grade</h1>
              <p className="mt-1 text-sm text-[#5f6368]">
                Record exam results for a student.
              </p>
            </div>
            <button
              onClick={() => refreshGrades()}
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
              <label className={labelClass} htmlFor="grade-date">
                Date
              </label>
              <input
                id="grade-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="grade-student">
                Student
              </label>
              <select
                id="grade-student"
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
              <label className={labelClass} htmlFor="grade-course">
                Course
              </label>
              <input
                id="grade-course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className={inputClass}
                placeholder="e.g. CS201 / Data Structures"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="grade-exam">
                Exam
              </label>
              <input
                id="grade-exam"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className={inputClass}
                placeholder="e.g. Midterm, Final, Quiz 1"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="grade-score">
                Score
              </label>
              <input
                id="grade-score"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className={inputClass}
                placeholder="e.g. 85"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="grade-max">
                Max score
              </label>
              <input
                id="grade-max"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className={inputClass}
                placeholder="e.g. 100"
                disabled={submitting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="grade-letter">
                Grade (optional)
              </label>
              <input
                id="grade-letter"
                value={grade}
                onChange={(e) => setGrade(e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="e.g. A, B+"
                disabled={submitting}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="grade-note">
                Note (optional)
              </label>
              <textarea
                id="grade-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="Any remarks about this exam…"
                disabled={submitting}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-4 text-base font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
              >
                {submitting ? 'Saving…' : 'Save grade'}
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
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass} htmlFor="filter-g-date">
                  Date
                </label>
                <input
                  id="filter-g-date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="filter-g-student">
                  Student
                </label>
                <select
                  id="filter-g-student"
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
                <label className={labelClass} htmlFor="filter-g-course">
                  Course
                </label>
                <input
                  id="filter-g-course"
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className={inputClass}
                  placeholder="Course filter"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="filter-g-exam">
                  Exam
                </label>
                <input
                  id="filter-g-exam"
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                  className={inputClass}
                  placeholder="Exam filter"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#5f6368]">
              {loading ? 'Loading…' : `${pagination.totalItems} grade records`}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="py-2 pr-3 font-medium">Course</th>
                  <th className="py-2 pr-3 font-medium">Exam</th>
                  <th className="py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 pr-3 font-medium">Grade</th>
                  <th className="py-2 pr-3 font-medium">Note</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-[#5f6368]">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && records.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-[#5f6368]">
                      No grades found
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
                    <td className="py-2 pr-3 text-[#202124]">{r.exam}</td>
                    <td className="py-2 pr-3 text-[#202124]">
                      {r.score} / {r.maxScore}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border border-[#dadce0] bg-[#f1f3f4] text-[#202124]">
                        {r.grade || computeGradeLetter(r.score, r.maxScore) || '—'}
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
                onClick={() => refreshGrades({ nextPage: 1 })}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => refreshGrades({ nextPage: pagination.page - 1 })}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => refreshGrades({ nextPage: pagination.page + 1 })}
                disabled={loading || pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => refreshGrades({ nextPage: pagination.totalPages })}
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
                Edit grade
              </h2>
              <button
                onClick={closeEdit}
                className="px-2 py-1 text-sm text-[#5f6368] hover:bg-[#f1f3f4] rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="edit-score">
                    Score
                  </label>
                  <input
                    id="edit-score"
                    type="number"
                    value={editing.score}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, score: e.target.value }))
                    }
                    className={inputClass}
                    disabled={editSubmitting}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="edit-max">
                    Max score
                  </label>
                  <input
                    id="edit-max"
                    type="number"
                    value={editing.maxScore}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, maxScore: e.target.value }))
                    }
                    className={inputClass}
                    disabled={editSubmitting}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="edit-grade">
                  Grade
                </label>
                <input
                  id="edit-grade"
                  value={editing.grade}
                  onChange={(e) =>
                    setEditing((s) => ({ ...s, grade: e.target.value.toUpperCase() }))
                  }
                  className={inputClass}
                  disabled={editSubmitting}
                />
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

export default Grades;
