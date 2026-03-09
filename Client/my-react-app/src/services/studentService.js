import api from './api.js';

/**
 * Fetch students (paginated + searchable). Requires auth.
 *
 * Params:
 * - q: search query
 * - course: course filter
 * - isActive: true/false filter
 * - page: page number (1-based)
 * - limit: page size
 *
 * Returns:
 * { items: Student[], pagination: { page, limit, totalItems, totalPages } }
 */
export async function getStudents(params = {}) {
  const { data } = await api.get('/students', { params });
  return data;
}

/**
 * Fetch a single student by id. Requires auth.
 */
export async function getStudent(id) {
  const { data } = await api.get(`/students/${id}`);
  return data;
}

/**
 * Create a student. Body: { name, email, enrollmentNumber, course, year, isActive? }. Requires auth.
 */
export async function createStudent(student) {
  const { data } = await api.post('/students', student);
  return data;
}

/**
 * Update a student by id. Partial body allowed. Requires auth.
 */
export async function updateStudent(id, updates) {
  const { data } = await api.put(`/students/${id}`, updates);
  return data;
}

/**
 * Delete a student by id. Requires auth.
 */
export async function deleteStudent(id) {
  await api.delete(`/students/${id}`);
}
