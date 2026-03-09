import api from './api.js';

/**
 * Fetch courses (paginated + searchable). Requires auth.
 *
 * Params:
 * - q: search query (name/code/department)
 * - department: filter by department
 * - isActive: true/false
 * - page: page number (1-based)
 * - limit: page size
 *
 * Returns:
 * { items: Course[], pagination: { page, limit, totalItems, totalPages } }
 */
export async function getCourses(params = {}) {
  const { data } = await api.get('/courses', { params });
  return data;
}

/**
 * Fetch a single course by id.
 */
export async function getCourse(id) {
  const { data } = await api.get(`/courses/${id}`);
  return data;
}

/**
 * Create a course.
 * Body: { name, code, department, credits, isActive? }
 */
export async function createCourse(course) {
  const { data } = await api.post('/courses', course);
  return data;
}

/**
 * Update a course by id.
 */
export async function updateCourse(id, updates) {
  const { data } = await api.put(`/courses/${id}`, updates);
  return data;
}

/**
 * Delete a course by id.
 */
export async function deleteCourse(id) {
  await api.delete(`/courses/${id}`);
}

