/**
 * Centralized Application Error Handler
 * Sanitizes server exceptions and ensures ALWAYS valid JSON is returned.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Server Error]', err);

  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'An unexpected error occurred while processing your request.';

  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors || {}).map(e => e.message).join(', ');
    message = msgs || 'Data validation failed.';
  } else if (err.code === 11000) {
    message = 'A record with this unique identifier or email already exists.';
  } else if (err.name === 'JsonWebTokenError') {
    message = 'Authentication token is invalid or malformed.';
  } else if (err.name === 'TokenExpiredError') {
    message = 'Authentication session has expired. Please log in again.';
  }

  // Guarantee application/json header
  res.setHeader('Content-Type', 'application/json');

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { debug: err.message, stack: err.stack })
  });
};

module.exports = errorHandler;
