/**
 * src/utils/AppError.js
 *
 * Custom error class that carries an HTTP status code.
 *
 * Why extend Error?
 *   We need errors that carry both a message AND an HTTP status code (404, 403, etc.)
 *   without putting status logic in every controller.
 *   The global error handler middleware reads `err.statusCode` to send the right response.
 *
 * isOperational flag:
 *   Operational errors = expected problems (not found, unauthorized, validation fail).
 *   Programming errors = unexpected bugs (null reference, unhandled rejection).
 *   The error handler checks this flag: operational errors get a clean response,
 *   programming errors trigger a generic 500 and log the stack trace.
 */

'use strict';

class AppError extends Error {
  /**
   * @param {string} message    - Human-readable error message
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500 ...)
   * @param {string} [code]     - Optional machine-readable error code for clients
   */
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode  = statusCode;
    this.code        = code;
    this.isOperational = true;   // Mark as expected/operational error

    // Captures the V8 stack trace excluding the AppError constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
