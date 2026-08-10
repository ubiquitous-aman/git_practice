/**
 * src/server.js
 *
 * Entry point — starts the HTTP server.
 *
 * What this file does:
 *   1. Loads environment variables
 *   2. Imports the configured Express app
 *   3. Tests the database connection before accepting traffic
 *   4. Starts listening on the configured port
 *   5. Handles graceful shutdown (SIGTERM/SIGINT) so in-flight requests finish
 *
 * Why graceful shutdown?
 *   When Docker stops a container or Kubernetes scales down a pod, it sends SIGTERM.
 *   If we immediately kill the process, in-flight requests get cut off mid-response.
 *   Graceful shutdown: stop accepting new requests, finish existing ones, then exit.
 *   10-second timeout is a safety net — we don't wait forever.
 */

'use strict';

require('dotenv').config();

const app = require('./app');
const db  = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Verify database connection before serving traffic
  try {
    await db.query('SELECT 1');
    console.log('[server] Database connection verified.');
  } catch (err) {
    console.error('[server] FATAL: Cannot connect to database:', err.message);
    console.error('[server] Check DATABASE_URL in your .env file.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] Placement Portal API running on port ${PORT}`);
    console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);

    server.close(async () => {
      console.log('[server] HTTP server closed.');
      try {
        await db.pool.end();
        console.log('[server] Database pool closed.');
      } catch (err) {
        console.error('[server] Error closing DB pool:', err.message);
      }
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('[server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));  // Docker stop
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));   // Ctrl+C in dev

  // Handle unhandled promise rejections — log and exit
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled Rejection:', reason);
    gracefulShutdown('unhandledRejection');
  });
}

startServer();
