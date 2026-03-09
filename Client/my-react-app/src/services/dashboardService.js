import api from './api.js';

/**
 * Fetch aggregated dashboard data from the backend.
 * GET /api/dashboard/summary
 *
 * Returns:
 * {
 *   totals: { students, activeStudents, users },
 *   studentsByCourse: [{ course, count }],
 *   recentStudents: [Student...]
 * }
 */
export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data;
}

