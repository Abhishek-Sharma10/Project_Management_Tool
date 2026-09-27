const { healthCheck } = require('../config/db');
const { success } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

const getHealth = asyncHandler(async (req, res) => {
  // Light DB ping so /api/health also confirms connectivity.
  await healthCheck();

  return success(res, null, 'API is running');
});

module.exports = {
  getHealth,
};
