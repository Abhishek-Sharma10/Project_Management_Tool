const { healthCheck } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/health
 * Performs a real DB ping and reports connectivity status.
 * Returns 200 if healthy, 503 if the database is unavailable.
 */
const getHealth = asyncHandler(async (req, res) => {
  let dbStatus = 'connected';
  let dbTime = null;

  try {
    const result = await healthCheck();
    dbTime = result.now;
  } catch (err) {
    // Database is unreachable — surface the real status instead of faking it
    return res.status(503).json({
      success: false,
      message: 'API is unhealthy',
      database: 'disconnected',
      error: err.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'API is healthy',
    database: dbStatus,
    dbTime,
  });
});

module.exports = {
  getHealth,
};
