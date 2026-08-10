/**
 * src/routes/health.js
 *
 * GET /api/health
 *
 * What: Simple endpoint that checks if the server is running and can reach the DB.
 *
 * Why:
 *   - Docker health checks call this to know when the container is ready.
 *   - Load balancers use it to route traffic only to healthy instances.
 *   - Monitoring systems (Prometheus, UptimeRobot) poll it.
 *   - During deployment you can wait until this returns 200 before considering deploy complete.
 *
 * Production safety:
 *   - We run a minimal DB query (SELECT 1) — not a heavy operation.
 *   - We do NOT expose sensitive config values (DB password, JWT secret).
 *   - We return a timestamp so you can verify the server time is correct.
 */

'use strict';

const express    = require('express');
const db         = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError  = null;

  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbError = err.message;
  }

  const status   = dbStatus === 'connected' ? 'ok' : 'degraded';
  const httpCode = status === 'ok' ? 200 : 503;

  return res.status(httpCode).json({
    success:   status === 'ok',
    status,
    database:  dbStatus,
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(process.uptime())}s`,
    version:   process.env.npm_package_version || '1.0.0',
    ...(dbError && process.env.NODE_ENV !== 'production' && { dbError }),
  });
}));

module.exports = router;
