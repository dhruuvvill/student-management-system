const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../services/studentService');

const getStudents = asyncHandler(async (req, res) => {
  const { q, course, isActive, page, limit } = req.query;

  const parsedIsActive =
    typeof isActive === 'string'
      ? isActive === 'true'
        ? true
        : isActive === 'false'
          ? false
          : undefined
      : undefined;

  const result = await getAllStudents({
    q,
    course,
    isActive: parsedIsActive,
    page,
    limit,
  });

  res.json(result);
});

const getStudent = asyncHandler(async (req, res, next) => {
  const student = await getStudentById(req.params.id);

  if (!student) {
    res.status(404);
    return next(new Error('Student not found'));
  }

  res.json(student);
});

const createStudentController = asyncHandler(async (req, res) => {
  const student = await createStudent(req.body);
  res.status(201).json(student);
});

const updateStudentController = asyncHandler(async (req, res, next) => {
  const student = await updateStudent(req.params.id, req.body);

  if (!student) {
    res.status(404);
    return next(new Error('Student not found'));
  }

  res.json(student);
});

const deleteStudentController = asyncHandler(async (req, res, next) => {
  const student = await deleteStudent(req.params.id);

  if (!student) {
    res.status(404);
    return next(new Error('Student not found'));
  }

  res.status(204).send();
});

module.exports = {
  getStudents,
  getStudent,
  createStudent: createStudentController,
  updateStudent: updateStudentController,
  deleteStudent: deleteStudentController,
};
