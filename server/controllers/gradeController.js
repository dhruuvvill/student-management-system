const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
} = require('../services/gradeService');

const getGrades = asyncHandler(async (req, res) => {
  const { student, course, exam, date, page, limit } = req.query;

  const result = await getAllGrades({
    student,
    course,
    exam,
    date,
    page,
    limit,
  });

  res.json(result);
});

const getGradeRecord = asyncHandler(async (req, res, next) => {
  const record = await getGradeById(req.params.id);

  if (!record) {
    res.status(404);
    return next(new Error('Grade record not found'));
  }

  res.json(record);
});

const createGradeController = asyncHandler(async (req, res) => {
  const record = await createGrade(req.body);
  res.status(201).json(record);
});

const updateGradeController = asyncHandler(async (req, res, next) => {
  const record = await updateGrade(req.params.id, req.body);

  if (!record) {
    res.status(404);
    return next(new Error('Grade record not found'));
  }

  res.json(record);
});

const deleteGradeController = asyncHandler(async (req, res, next) => {
  const record = await deleteGrade(req.params.id);

  if (!record) {
    res.status(404);
    return next(new Error('Grade record not found'));
  }

  res.status(204).send();
});

module.exports = {
  getGrades,
  getGradeRecord,
  createGrade: createGradeController,
  updateGrade: updateGradeController,
  deleteGrade: deleteGradeController,
};

