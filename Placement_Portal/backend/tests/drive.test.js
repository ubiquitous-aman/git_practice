/**
 * tests/drive.test.js
 *
 * Integration tests for Placement Drive APIs.
 */

'use strict';

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');
const { generateToken } = require('../src/utils/jwt');

describe('DRIVE API (/api/drives)', () => {
  let tpoToken;
  let studentToken;
  let studentUserId;
  let companyId;

  beforeEach(async () => {
    await db.query('DELETE FROM drive_branches');
    await db.query('DELETE FROM placement_drives');
    await db.query('DELETE FROM student_profiles');
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM users');

    const passHash = await hashPassword('Password123!');

    // Create TPO user
    const tpoRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('TPO Officer', 'tpo@drives.com', $1, 'tpo')
       RETURNING id, email, role`,
      [passHash]
    );
    tpoToken = generateToken(tpoRes.rows[0]);

    // Create Student user + profile
    const studentRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Student Drives', 'student@drives.com', $1, 'student')
       RETURNING id, email, role`,
      [passHash]
    );
    studentUserId = studentRes.rows[0].id;
    studentToken = generateToken(studentRes.rows[0]);

    await db.query(
      `INSERT INTO student_profiles (user_id, roll_number, branch, cgpa, active_backlogs, graduation_year)
       VALUES ($1, 'DRIVE001', 'CSE', 8.20, 0, 2027)`,
      [studentUserId]
    );

    // Create Company
    const compRes = await db.query(
      `INSERT INTO companies (name, website, description)
       VALUES ('Amazon', 'https://amazon.com', 'E-commerce and Cloud')
       RETURNING id`
    );
    companyId = compRes.rows[0].id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM drive_branches');
    await db.query('DELETE FROM placement_drives');
    await db.query('DELETE FROM student_profiles');
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM users');
    await db.pool.end();
  });

  describe('POST /api/drives', () => {
    it('should allow TPO to create a placement drive', async () => {
      const res = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({
          company_id: companyId,
          job_role: 'Software Development Engineer',
          package_lpa: 18.5,
          location: 'Bengaluru',
          minimum_cgpa: 7.5,
          maximum_backlogs: 0,
          graduation_year: 2027,
          application_deadline: '2099-12-31T23:59:59Z',
          eligible_branches: ['CSE', 'IT'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.drive.job_role).toBe('Software Development Engineer');
      expect(res.body.data.drive.eligible_branches).toEqual(['CSE', 'IT']);
    });
  });

  describe('GET /api/drives/:id/eligibility', () => {
    it('should evaluate student eligibility for drive', async () => {
      // Create drive requiring CSE & CGPA >= 7.5
      const createRes = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({
          company_id: companyId,
          job_role: 'SDE-1',
          minimum_cgpa: 7.5,
          maximum_backlogs: 0,
          graduation_year: 2027,
          application_deadline: '2099-12-31T23:59:59Z',
          eligible_branches: ['CSE'],
        });

      const driveId = createRes.body.data.drive.id;

      // Student has CGPA 8.2, CSE, 0 backlogs -> Eligible
      const res = await request(app)
        .get(`/api/drives/${driveId}/eligibility`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.eligibility.is_eligible).toBe(true);
      expect(res.body.data.eligibility.reasons).toHaveLength(0);
    });
  });
});
