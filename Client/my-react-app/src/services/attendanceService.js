import api from './api.js';

/**
 * Fetch attendance records (paginated + filterable). Requires auth.
 *
 * Params:
 * - student: student id
 * - course: course name/code string
 * - status: 'present' | 'absent' | 'late'
 * - date: ISO date string (YYYY-MM-DD)
 * - page: page number
 * - limit: page size
 */
export async function getAttendance(params = {}) {
  const { data } = await api.get('/attendance', { params });
  return data;
}

/**
 * Create attendance record.
 * Body: { student, course, date, status, note? }
 */
export async function createAttendance(record) {
  const { data } = await api.post('/attendance', record);
  return data;
}

/**
 * Update attendance by id.
 */
export async function updateAttendance(id, updates) {
  const { data } = await api.put(`/attendance/${id}`, updates);
  return data;
}

/**
 * Delete attendance by id.
 */
export async function deleteAttendance(id) {
  await api.delete(`/attendance/${id}`);
}

