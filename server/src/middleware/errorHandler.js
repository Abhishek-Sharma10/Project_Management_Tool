const AppError = require('../utils/AppError');

/**
 * Catch async route handlers and forward errors to the central error middleware.
 * Avoids repetitive try/catch in every controller.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Centralized error handler — keeps response shape consistent.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // PostgreSQL unique violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
    details = { constraint: err.constraint };
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Related resource not found';
    details = { constraint: err.constraint };
  }

  // PostgreSQL check / enum violation
  if (err.code === '23514' || err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid input value';
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  const payload = {
    success: false,
    message,
  };

  if (details) {
    payload.details = details;
  }

  // Never leak stack traces in production
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  asyncHandler,
  notFoundHandler,
  errorHandler,
};
