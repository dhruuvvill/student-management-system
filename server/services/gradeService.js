const Grade = require('../models/Grade');

function buildGradeFilters({ student, course, exam, date }) {
  const filter = {};

  if (student) {
    filter.student = student;
  }

  if (typeof course === 'string' && course.trim()) {
    filter.course = course.trim();
  }

  if (typeof exam === 'string' && exam.trim()) {
    filter.exam = exam.trim();
  }

  if (typeof date === 'string' && date.trim()) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }
  }

  return filter;
}

const getAllGrades = async ({ student, course, exam, date, page = 1, limit = 10 }) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const filter = buildGradeFilters({ student, course, exam, date });

  const query = Grade.find(filter)
    .populate('student', 'name email enrollmentNumber course year')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(safeLimit);

  const [items, totalItems] = await Promise.all([
    query,
    Grade.countDocuments(filter),
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

const getGradeById = async (id) => {
  return Grade.findById(id).populate('student', 'name email enrollmentNumber course year');
};

const createGrade = async (data) => {
  const grade = new Grade(data);
  return grade.save();
};

const updateGrade = async (id, data) => {
  return Grade.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate('student', 'name email enrollmentNumber course year');
};

const deleteGrade = async (id) => {
  return Grade.findByIdAndDelete(id);
};

module.exports = {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
};

