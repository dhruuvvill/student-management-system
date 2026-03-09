const Attendance = require('../models/Attendance');

function buildAttendanceFilters({ student, course, status, date }) {
  const filter = {};

  if (student) {
    filter.student = student;
  }

  if (typeof course === 'string' && course.trim()) {
    filter.course = course.trim();
  }

  if (typeof status === 'string' && status.trim()) {
    filter.status = status.trim();
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

const getAllAttendance = async ({ student, course, status, date, page = 1, limit = 10 }) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const filter = buildAttendanceFilters({ student, course, status, date });

  const query = Attendance.find(filter)
    .populate('student', 'name email enrollmentNumber course year')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(safeLimit);

  const [items, totalItems] = await Promise.all([
    query,
    Attendance.countDocuments(filter),
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

const getAttendanceById = async (id) => {
  return Attendance.findById(id).populate('student', 'name email enrollmentNumber course year');
};

const createAttendance = async (data) => {
  const attendance = new Attendance(data);
  return attendance.save();
};

const updateAttendance = async (id, data) => {
  return Attendance.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate('student', 'name email enrollmentNumber course year');
};

const deleteAttendance = async (id) => {
  return Attendance.findByIdAndDelete(id);
};

module.exports = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};

