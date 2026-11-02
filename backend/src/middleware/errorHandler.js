/**
 * Centralized Application Error Handler
 * Sanitizes server exceptions and prevents stack traces leaking in production.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Server Error]', err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An unexpected error occurred while processing your request.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { debug: err.message })
  });
};

module.exports = errorHandler;
