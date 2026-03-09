const Student = require('../models/Student');
const User = require('../models/User');

const getDashboardSummary = async () => {
  const [totalStudents, activeStudents, totalUsers, studentsByCourseDocs, recentStudents] =
    await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isActive: true }),
      User.countDocuments(),
      Student.aggregate([
        {
          $group: {
            _id: '$course',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Student.find().sort({ createdAt: -1 }).limit(5),
    ]);

  const studentsByCourse = studentsByCourseDocs.map((c) => ({
    course: c._id,
    count: c.count,
  }));

  return {
    totals: {
      students: totalStudents,
      activeStudents,
      users: totalUsers,
    },
    studentsByCourse,
    recentStudents,
  };
};

module.exports = {
  getDashboardSummary,
};
