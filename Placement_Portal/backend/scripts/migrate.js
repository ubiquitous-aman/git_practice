/**
 * migrate.js — Database Migration Runner
 *
 * What it does:
 *   1. Connects to PostgreSQL using DATABASE_URL (or TEST_DATABASE_URL in test mode)
 *   2. Creates a schema_migrations table if it doesn't exist
 *   3. Reads all .sql files from /migrations sorted by filename
 *   4. Skips already-applied migrations
 *   5. Runs new migrations inside a transaction (if one fails, it rolls back)
 *   6. Records successful migrations in schema_migrations
 */

'use strict';

const { Client } = require('pg');
const fs         = require('fs');
const path       = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Respect NODE_ENV=test
const connectionString =
  process.env.NODE_ENV === 'test'
    ? (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
    : process.env.DATABASE_URL;

async function runMigrations() {
  console.log(`[migrate] Target database: ${connectionString.split('@')[1] || connectionString}`);
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('[migrate] Connected to PostgreSQL');

    // Create the tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // Read migration files, sort alphabetically (001_... before 002_... etc.)
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('[migrate] No migration files found.');
      return;
    }

    // Find already-applied migrations
    const { rows: applied } = await client.query(
      'SELECT filename FROM schema_migrations'
    );
    const appliedSet = new Set(applied.map(r => r.filename));

    let ranCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[migrate] SKIP  ${file} (already applied)`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql      = fs.readFileSync(filePath, 'utf8');

      // Wrap each migration in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[migrate] OK    ${file}`);
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate] FAIL  ${file}`);
        console.error(`[migrate] Error: ${err.message}`);
        process.exit(1);
      }
    }

    if (ranCount === 0) {
      console.log('[migrate] Nothing to migrate — database is up to date.');
    } else {
      console.log(`[migrate] Done — applied ${ranCount} migration(s).`);
    }
  } finally {
    await client.end();
  }
}

runMigrations().catch(err => {
  console.error('[migrate] Unexpected error:', err.message);
  process.exit(1);
});
