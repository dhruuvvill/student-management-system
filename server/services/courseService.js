const Course = require('../models/Course');

function buildCourseFilters({ q, department, isActive }) {
  const filter = {};

  if (typeof department === 'string' && department.trim()) {
    filter.department = department.trim();
  }

  if (typeof isActive === 'boolean') {
    filter.isActive = isActive;
  }

  if (typeof q === 'string' && q.trim()) {
    const query = q.trim();
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } },
      { department: { $regex: query, $options: 'i' } },
    ];
  }

  return filter;
}

const getAllCourses = async ({ q, department, isActive, page = 1, limit = 10 }) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const filter = buildCourseFilters({ q, department, isActive });

  const [items, totalItems] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Course.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / safeLimit), 1);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
    },
  };
};

const getCourseById = async (id) => {
  return Course.findById(id);
};

const createCourse = async (data) => {
  const course = new Course(data);
  return course.save();
};

const updateCourse = async (id, data) => {
  return Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteCourse = async (id) => {
  return Course.findByIdAndDelete(id);
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};

