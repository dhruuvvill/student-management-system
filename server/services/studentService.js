const Student = require('../models/Student');

function buildStudentFilters({ q, course, isActive }) {
  const filter = {};

  if (typeof course === 'string' && course.trim()) {
    filter.course = course.trim();
  }

  if (typeof isActive === 'boolean') {
    filter.isActive = isActive;
  }

  if (typeof q === 'string' && q.trim()) {
    const query = q.trim();
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { enrollmentNumber: { $regex: query, $options: 'i' } },
      { course: { $regex: query, $options: 'i' } },
    ];
  }

  return filter;
}

const getAllStudents = async ({ q, course, isActive, page = 1, limit = 10 }) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const filter = buildStudentFilters({ q, course, isActive });

  const [items, totalItems] = await Promise.all([
    Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Student.countDocuments(filter),
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

const getStudentById = async (id) => {
  return Student.findById(id);
};

const createStudent = async (data) => {
  const student = new Student(data);
  return student.save();
};

const updateStudent = async (id, data) => {
  return Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteStudent = async (id) => {
  return Student.findByIdAndDelete(id);
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
