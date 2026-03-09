const express = require('express');
const {
  getAttendance,
  getAttendanceRecord,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getAttendance).post(createAttendance);

router
  .route('/:id')
  .get(getAttendanceRecord)
  .put(updateAttendance)
  .delete(deleteAttendance);

module.exports = router;

