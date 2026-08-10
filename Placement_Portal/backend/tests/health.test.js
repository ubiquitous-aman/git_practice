/**
 * tests/health.test.js
 *
 * What we're testing:
 *   The GET /api/health endpoint — our most basic sanity check.
 *
 * Why this test matters:
 *   If health fails, nothing else in the system is working correctly.
 *   It verifies: Express is running, routing works, DB is reachable, response shape is correct.
 *
 * How Supertest works:
 *   supertest(app) creates a test HTTP server wrapping our Express app.
 *   No real port is opened. Requests go directly to the app in memory.
 *   This is why app.js and server.js are separate — tests import app, not server.
 *
 * IMPORTANT: These tests require a running PostgreSQL instance.
 *   For local dev: your local postgres must be running with placement_portal_test DB.
 *   For CI: the GitHub Actions workflow will spin up a postgres service container.
 */

'use strict';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/config/database');

describe('GET /api/health', () => {
  // Close the DB pool after all tests in this file complete
  // Without this, Jest hangs waiting for open connections to close
  afterAll(async () => {
    await db.pool.end();
  });

  it('should return 200 with status ok when DB is connected', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeDefined();
  });

  it('should return JSON content-type', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 404 with correct shape for unknown routes', async () => {
    const res = await request(app).post('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});
