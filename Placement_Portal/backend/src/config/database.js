/**
 * src/config/database.js
 *
 * What: Creates and exports a PostgreSQL connection pool.
 *
 * Why a pool?
 *   A pool maintains multiple open connections and reuses them.
 *   Opening a new TCP connection to PostgreSQL for every HTTP request is expensive.
 *   The pool hands out existing connections and waits if all are busy.
 *
 * Why pg.Pool and not pg.Client?
 *   pg.Client is a single connection. If two requests arrive simultaneously,
 *   one waits for the other to finish. pg.Pool handles concurrency correctly.
 *
 * Cross-platform:
 *   The pg library reads DATABASE_URL as a standard connection string,
 *   which works identically on Linux and Windows.
 */

'use strict';

const { Pool } = require('pg');

// In test environment, use a separate database to avoid polluting dev data
const connectionString =
  process.env.NODE_ENV === 'test'
    ? (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
    : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  // Maximum simultaneous connections in the pool
  max: 10,
  // How long (ms) to wait for a connection before throwing an error
  connectionTimeoutMillis: 5000,
  // How long (ms) an idle connection stays in the pool before being closed
  idleTimeoutMillis: 30000,
});

// Log connection errors so they are visible in server logs
pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

/**
 * query — wrapper around pool.query for consistent interface.
 *
 * Usage:
 *   const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
 *
 * $1, $2 are parameterized placeholders — they prevent SQL injection.
 * The pg library escapes values before passing them to PostgreSQL.
 */
const query = (text, params) => pool.query(text, params);

/**
 * getClient — get a raw client for transactions.
 *
 * Usage:
 *   const client = await db.getClient();
 *   try {
 *     await client.query('BEGIN');
 *     await client.query(...);
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *   } finally {
 *     client.release(); // ALWAYS release back to pool
 *   }
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
