const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const { getDashboardSummary } = require('../services/dashboardService');

const getSummary = asyncHandler(async (req, res) => {
  const data = await getDashboardSummary();
  res.json(data);
});

module.exports = {
  getSummary,
};
