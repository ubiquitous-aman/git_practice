/**
 * src/middleware/errorHandler.js
 *
 * Global error handling middleware.
 *
 * Express recognizes a 4-parameter middleware as an error handler.
 * It only fires when next(err) is called anywhere in the application.
 *
 * Design decisions:
 *
 * 1. Never expose stack traces in production — attackers can use them to find vulnerabilities.
 * 2. Distinguish operational errors (AppError) from programming errors (bugs).
 * 3. Handle PostgreSQL-specific errors with friendly messages.
 * 4. Return a consistent JSON structure on every error.
 *
 * Consistent error response shape:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "...",
 *     "details": []     // optional
 *   }
 * }
 */

'use strict';

const AppError = require('../utils/AppError');

// Handle PostgreSQL-specific error codes
function handleDatabaseError(err) {
  // Unique constraint violation (e.g., duplicate email or duplicate application)
  if (err.code === '23505') {
    const field = err.detail
      ? err.detail.match(/\(([^)]+)\)/)?.[1] || 'field'
      : 'field';
    return new AppError(
      `A record with this ${field} already exists.`,
      409,
      'DUPLICATE_RECORD'
    );
  }

  // Foreign key violation (e.g., referencing a non-existent company)
  if (err.code === '23503') {
    return new AppError(
      'Referenced resource does not exist.',
      400,
      'INVALID_REFERENCE'
    );
  }

  // Check constraint violation (e.g., CGPA out of range)
  if (err.code === '23514') {
    return new AppError(
      'Data violates a database constraint.',
      400,
      'CONSTRAINT_VIOLATION'
    );
  }

  // Not-null constraint violation
  if (err.code === '23502') {
    return new AppError(
      `Required field is missing: ${err.column || 'unknown'}.`,
      400,
      'MISSING_FIELD'
    );
  }

  return null; // Not a known DB error
}

/**
 * errorHandler — Express global error middleware (4 args required by Express)
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log all errors server-side
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[error] ${req.method} ${req.originalUrl} —`, err.message);
    if (!err.isOperational) {
      console.error(err.stack);
    }
  }

  // Try to map database errors to user-friendly AppErrors
  const dbError = handleDatabaseError(err);
  if (dbError) {
    return res.status(dbError.statusCode).json({
      success: false,
      error: {
        code:    dbError.code,
        message: dbError.message,
      },
    });
  }

  // Known operational errors (thrown deliberately with AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code:    err.code    || 'ERROR',
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token.' },
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Authentication token has expired.' },
    });
  }

  // Programming errors or unknown — don't leak details in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message;

  return res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_SERVER_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
