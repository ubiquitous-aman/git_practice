/**
 * src/middleware/requestLogger.js
 *
 * HTTP request logger using morgan.
 *
 * In development: "dev" format — colorized, concise (method + url + status + time)
 * In production:  "combined" format — Apache-style, comprehensive (includes IP, user-agent)
 *                 Suitable for feeding into log aggregation tools.
 * In test:        disabled — we don't want log noise during test runs.
 *
 * morgan is a well-maintained, widely-used request logging middleware.
 * We don't reinvent this — we configure it correctly.
 */

'use strict';

const morgan = require('morgan');

function requestLogger() {
  if (process.env.NODE_ENV === 'test') {
    // Return a no-op middleware in test environment
    return (req, res, next) => next();
  }

  const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  return morgan(format);
}

module.exports = requestLogger;
