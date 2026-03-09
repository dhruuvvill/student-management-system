import api from './api.js';

/**
 * Fetch grade records (paginated + filterable). Requires auth.
 *
 * Params:
 * - student: student id
 * - course: course name/code
 * - exam: exam name
 * - date: ISO date (YYYY-MM-DD)
 * - page: page number
 * - limit: page size
 */
export async function getGrades(params = {}) {
  const { data } = await api.get('/grades', { params });
  return data;
}

/**
 * Create grade record.
 * Body: { student, course, exam, date, score, maxScore, grade?, note? }
 */
export async function createGrade(record) {
  const { data } = await api.post('/grades', record);
  return data;
}

/**
 * Update grade by id.
 */
export async function updateGrade(id, updates) {
  const { data } = await api.put(`/grades/${id}`, updates);
  return data;
}

/**
 * Delete grade by id.
 */
export async function deleteGrade(id) {
  await api.delete(`/grades/${id}`);
}

