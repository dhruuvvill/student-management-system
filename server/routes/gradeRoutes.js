const express = require('express');
const {
  getGrades,
  getGradeRecord,
  createGrade,
  updateGrade,
  deleteGrade,
} = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getGrades).post(createGrade);

router
  .route('/:id')
  .get(getGradeRecord)
  .put(updateGrade)
  .delete(deleteGrade);

module.exports = router;

