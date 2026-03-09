const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All student routes require a logged-in user
router.use(protect);

// List and view students: any authenticated user
router.route('/').get(getStudents);
router.route('/:id').get(getStudent);

// Create/update/delete students: only admins
router.post('/', authorize('admin'), createStudent);
router.put('/:id', authorize('admin'), updateStudent);
router.delete('/:id', authorize('admin'), deleteStudent);

module.exports = router;
