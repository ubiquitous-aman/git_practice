/**
 * tests/student.test.js
 *
 * Automated tests for Student Profile APIs.
 */

'use strict';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/config/database');

describe('STUDENT API (/api/students)', () => {
  let studentToken;
  let studentUserId;

  beforeEach(async () => {
    await db.query('DELETE FROM student_profiles');
    await db.query('DELETE FROM users');

    // Register test student
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Ananya Roy',
      email: 'ananya@college.edu',
      password: 'Password123!',
    });

    studentToken = regRes.body.data.token;
    studentUserId = regRes.body.data.user.id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM student_profiles');
    await db.query('DELETE FROM users');
    await db.pool.end();
  });

  describe('PUT /api/students/profile', () => {
    it('should create a student profile successfully', async () => {
      const res = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roll_number: '2023CSE001',
          branch: 'CSE',
          cgpa: 8.75,
          active_backlogs: 0,
          graduation_year: 2027,
          resume_url: 'https://example.com/resume.pdf',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.roll_number).toBe('2023CSE001');
      expect(res.body.data.profile.branch).toBe('CSE');
      expect(Number(res.body.data.profile.cgpa)).toBe(8.75);
    });

    it('should update existing profile on subsequent PUT request', async () => {
      // Create first
      await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roll_number: '2023CSE001',
          branch: 'CSE',
          cgpa: 8.0,
          active_backlogs: 1,
          graduation_year: 2027,
        });

      // Update CGPA and clear backlog
      const res = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roll_number: '2023CSE001',
          branch: 'CSE',
          cgpa: 8.5,
          active_backlogs: 0,
          graduation_year: 2027,
        });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.profile.cgpa)).toBe(8.5);
      expect(res.body.data.profile.active_backlogs).toBe(0);
    });

    it('should reject invalid CGPA (> 10)', async () => {
      const res = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roll_number: '2023CSE001',
          branch: 'CSE',
          cgpa: 11.5, // invalid!
          active_backlogs: 0,
          graduation_year: 2027,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject negative active backlogs', async () => {
      const res = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roll_number: '2023CSE001',
          branch: 'CSE',
          cgpa: 8.0,
          active_backlogs: -2, // invalid!
          graduation_year: 2027,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/students/profile', () => {
    it('should return profile after creation', async () => {
      await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roll_number: '2023CSE001',
          branch: 'CSE',
          cgpa: 9.1,
          active_backlogs: 0,
          graduation_year: 2027,
        });

      const res = await request(app)
        .get('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.roll_number).toBe('2023CSE001');
      expect(res.body.data.profile.name).toBe('Ananya Roy');
    });

    it('should return 404 if profile has not been created yet', async () => {
      const res = await request(app)
        .get('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PROFILE_NOT_FOUND');
    });
  });
});
