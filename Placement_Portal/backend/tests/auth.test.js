/**
 * tests/auth.test.js
 *
 * Automated integration tests for Authentication & Authorization APIs.
 */

'use strict';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/config/database');

describe('AUTH API (/api/auth)', () => {
  beforeEach(async () => {
    // Clean users table before each test
    await db.query('DELETE FROM users');
  });

  afterAll(async () => {
    await db.query('DELETE FROM users');
    await db.pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Rahul Sharma',
          email: 'rahul@college.edu',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('rahul@college.edu');
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.password_hash).toBeUndefined(); // Never expose password hash!
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        name: 'Rahul Sharma',
        email: 'rahul@college.edu',
        password: 'Password123!',
      });

      // Duplicate registration
      const res = await request(app).post('/api/auth/register').send({
        name: 'Rahul Duplicate',
        email: 'rahul@college.edu',
        password: 'Password456!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('should fail when email is invalid', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'invalid-email-format',
        password: 'Password123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'SecretPassword123',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'student@test.com',
        password: 'SecretPassword123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('student@test.com');
    });

    it('should fail login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'student@test.com',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Profile Student',
        email: 'profile@test.com',
        password: 'ProfilePassword123',
      });
      token = res.body.data.token;
    });

    it('should return user profile when valid token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('profile@test.com');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
