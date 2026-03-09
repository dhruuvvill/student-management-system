const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../services/courseService');

const getCourses = asyncHandler(async (req, res) => {
  const { q, department, isActive, page, limit } = req.query;

  const parsedIsActive =
    typeof isActive === 'string'
      ? isActive === 'true'
        ? true
        : isActive === 'false'
          ? false
          : undefined
      : undefined;

  const result = await getAllCourses({
    q,
    department,
    isActive: parsedIsActive,
    page,
    limit,
  });

  res.json(result);
});

const getCourse = asyncHandler(async (req, res, next) => {
  const course = await getCourseById(req.params.id);

  if (!course) {
    res.status(404);
    return next(new Error('Course not found'));
  }

  res.json(course);
});

const createCourseController = asyncHandler(async (req, res) => {
  const course = await createCourse(req.body);
  res.status(201).json(course);
});

const updateCourseController = asyncHandler(async (req, res, next) => {
  const course = await updateCourse(req.params.id, req.body);

  if (!course) {
    res.status(404);
    return next(new Error('Course not found'));
  }

  res.json(course);
});

const deleteCourseController = asyncHandler(async (req, res, next) => {
  const course = await deleteCourse(req.params.id);

  if (!course) {
    res.status(404);
    return next(new Error('Course not found'));
  }

  res.status(204).send();
});

module.exports = {
  getCourses,
  getCourse,
  createCourse: createCourseController,
  updateCourse: updateCourseController,
  deleteCourse: deleteCourseController,
};

