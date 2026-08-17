const mongoose = require('mongoose');

/**
 * AppError
 *
 * Custom operational error class.
 * Distinguishes expected business errors (4xx) from programming bugs (5xx).
 * Any error thrown with new AppError(...) gets a clean JSON response.
 * Unexpected errors (programming errors, library bugs) get a generic 500.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Expected, known error
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * notFound
 *
 * Middleware for unmatched routes.
 * Converts 404 misses into an AppError so errorHandler handles them uniformly.
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * errorHandler
 *
 * Global error-handling middleware (4 args — Express requires all 4).
 * Handles:
 *  - AppError (operational)      → structured JSON, correct status code
 *  - Mongoose ValidationError    → 400 with field-level messages
 *  - Mongoose CastError          → 400 (invalid ObjectId etc.)
 *  - Mongoose duplicate key      → 409 with field name
 *  - Everything else             → 500, message hidden in production
 */
const errorHandler = (err, req, res, next) => {  // eslint-disable-line no-unused-vars
  const isProduction = process.env.NODE_ENV === 'production';

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: messages,
    });
  }

  // ── Mongoose CastError (e.g., invalid ObjectId) ────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid value for field '${err.path}': ${err.value}`,
    });
  }

  // ── MongoDB Duplicate Key Error ────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      status: 'fail',
      message: `Duplicate value: '${field}' already exists`,
    });
  }

  // ── Operational (AppError) ─────────────────────────────────────────────────
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.statusCode < 500 ? 'fail' : 'error',
      message: err.message,
    });
  }

  // ── Unknown / Programming Error ────────────────────────────────────────────
  // Log full error for debugging — never expose stack in production
  console.error('UNHANDLED ERROR:', err);

  return res.status(500).json({
    status: 'error',
    message: isProduction ? 'Something went wrong. Please try again later.' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { AppError, notFound, errorHandler };
