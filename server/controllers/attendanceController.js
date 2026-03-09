const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require('../services/attendanceService');

const getAttendance = asyncHandler(async (req, res) => {
  const { student, course, status, date, page, limit } = req.query;

  const result = await getAllAttendance({
    student,
    course,
    status,
    date,
    page,
    limit,
  });

  res.json(result);
});

const getAttendanceRecord = asyncHandler(async (req, res, next) => {
  const record = await getAttendanceById(req.params.id);

  if (!record) {
    res.status(404);
    return next(new Error('Attendance record not found'));
  }

  res.json(record);
});

const createAttendanceController = asyncHandler(async (req, res) => {
  const record = await createAttendance(req.body);
  res.status(201).json(record);
});

const updateAttendanceController = asyncHandler(async (req, res, next) => {
  const record = await updateAttendance(req.params.id, req.body);

  if (!record) {
    res.status(404);
    return next(new Error('Attendance record not found'));
  }

  res.json(record);
});

const deleteAttendanceController = asyncHandler(async (req, res, next) => {
  const record = await deleteAttendance(req.params.id);

  if (!record) {
    res.status(404);
    return next(new Error('Attendance record not found'));
  }

  res.status(204).send();
});

module.exports = {
  getAttendance,
  getAttendanceRecord,
  createAttendance: createAttendanceController,
  updateAttendance: updateAttendanceController,
  deleteAttendance: deleteAttendanceController,
};

