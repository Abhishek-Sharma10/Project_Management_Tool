const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStatsForUser(req.user.id);
  return success(res, { stats }, 'Dashboard stats');
});

module.exports = {
  getDashboard,
};
